import uuid
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q, Max
from niqabaty.models import Notification, SeenNotification, Device
from niqabaty.serializers import NotificationSerializer, AggregatedNotificationSerializer
from niqabaty.utils.firebase import send_fcm_message, send_fcm_multicast, send_fcm_topic_message
from niqabaty.utils.notifications import send_notification
import niqabaty.utils.firebase as firebase
from niqabaty.models import User

def visible_to(user):
    """Notifications a member sees: their own, plus broadcasts sent since
    their account was created (not the whole history before they joined)."""
    return (
        Q(user=user, send_to_all_devices=False)
        | Q(send_to_all_devices=True, created_at__gte=user.date_joined)
    )


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read', 'id']
    ordering = ['-created_at', '-id']


    def get_queryset(self):
        """Filter notifications for the current user, or all if superuser."""
        queryset = Notification.objects.all()
        if not self.request.user.is_superuser:
            queryset = queryset.filter(visible_to(self.request.user))
        
        # Filter by source: system vs manual
        source = self.request.query_params.get('source')
        if source == 'system':
            queryset = queryset.filter(created_by__isnull=True)
        elif source == 'manual':
            queryset = queryset.filter(created_by__isnull=False)

        # Superuser can filter by target user or branch
        target_user_id = self.request.query_params.get('target_user_id')
        if target_user_id:
            queryset = queryset.filter(user_id=target_user_id)
            
        branch_ids = self.request.query_params.get('branch_ids')
        if branch_ids:
            from niqabaty.models import Branch
            branch_id_list = [int(id.strip()) for id in branch_ids.split(',') if id.strip().isdigit()]
            if branch_id_list:
                # Include sub-branches
                all_branch_ids = set(branch_id_list)
                child_branch_ids = Branch.objects.filter(parent_id__in=branch_id_list).values_list('id', flat=True)
                all_branch_ids.update(child_branch_ids)
                queryset = queryset.filter(user__branches__id__in=all_branch_ids).distinct()
                
        return queryset.order_by('-created_at', '-id')

    def retrieve(self, request, *args, **kwargs):
        """
        Overridden to mark the notification as read and seen when fetched.
        """
        instance = self.get_object()
        
        # Mark as read if not already
        if not instance.is_read:
            instance.is_read = True
            instance.read_at = timezone.now()
            instance.save()
            
        # Also mark as seen
        SeenNotification.objects.get_or_create(
            user=request.user,
            notification=instance
        )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_seen(self, request, pk=None):
        """
        Mark a notification as seen by the current user.
        Creates a SeenNotification record.
        """
        notification = self.get_object()
        
        # Create or get the SeenNotification record
        seen_notification, created = SeenNotification.objects.get_or_create(
            user=request.user,
            notification=notification
        )
        
        return Response(
            {
                'status': 'success',
                'message': 'Notification marked as seen',
                'seen_at': seen_notification.seen_at
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read and set read_at timestamp.
        Also creates a SeenNotification record if not already seen.
        """
        notification = self.get_object()
        
        # Mark as read
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        # Also mark as seen
        SeenNotification.objects.get_or_create(
            user=request.user,
            notification=notification
        )
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        """
        Mark a notification as unread.
        """
        notification = self.get_object()
        
        notification.is_read = False
        notification.read_at = None
        notification.save()
        
        SeenNotification.objects.filter(
            user=request.user,
            notification=notification
        ).delete()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Mark all unread notifications for the current user as read.
        """
        # Broadcasts are read per member through SeenNotification, so they
        # need a record too, not only the member's own notifications.
        notification_ids = list(
            Notification.objects.filter(visible_to(request.user))
            .exclude(seen_by__user=request.user)
            .values_list('id', flat=True)
        )
        count = len(notification_ids)

        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        SeenNotification.objects.bulk_create(
            [SeenNotification(user=request.user, notification_id=nid) for nid in notification_ids],
            ignore_conflicts=True,
        )
        
        return Response(
            {
                'status': 'success',
                'message': f'{count} notifications marked as read',
                'count': count
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get the count of unread notifications for the current user.
        Counts notifications that don't have a SeenNotification record.
        """
        # Get IDs of notifications the user has seen
        seen_notification_ids = SeenNotification.objects.filter(
            user=request.user
        ).values_list('notification_id', flat=True)
        
        # Count notifications that are either:
        # 1. Sent to the user individually (user=request.user)
        # 2. Broadcast to all devices (send_to_all_devices=True)
        # And exclude those that have been seen
        unread_count = Notification.objects.filter(
            visible_to(request.user)
        ).exclude(
            id__in=seen_notification_ids
        ).count()
        
        return Response(
            {
                'unread_count': unread_count
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def send_single(self, request):
        """
        Send a single notification to a user.
        Expected payload: {
            'user_id': int,
            'title': str,
            'message': str,
            'notification_type': str (optional, default: 'info'),
            'content_type': str (optional),
            'object_id': int (optional)
        }
        """
        from niqabaty.models import User
        
        try:
            user_id = request.data.get('user_id')
            title = request.data.get('title')
            message = request.data.get('message')
            notification_type = request.data.get('notification_type', 'info')
            content_type = request.data.get('content_type')
            object_id = request.data.get('object_id')
            
            if not user_id or not title or not message:
                return Response(
                    {'error': 'user_id, title, and message are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': f'User with id {user_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            success, message_or_error = send_notification(
                user_ids=[user_id],
                title=title,
                message=message,
                notification_type=notification_type,
                content_type=content_type,
                object_id=object_id,
                created_by=request.user
            )

            if success:
                # Get the last created notification to return
                notification = Notification.objects.filter(user_id=user_id).latest('created_at')
                serializer = self.get_serializer(notification)
                return Response(
                    {
                        'status': 'success',
                        'message': 'Notification sent successfully',
                        'notification': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': message_or_error},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def send_bulk(self, request):
        """
        Send notifications to multiple users or all devices via topic.
        Accepts either user_ids or filter params (branch_ids, user_type, gender, city, etc.)
        to let the backend query matching users directly.
        Expected payload: {
            'user_ids': [int, ...],  # Optional - use filter params instead
            'title': str,
            'message': str,
            'notification_type': str (optional),
            'content_type': str (optional),
            'object_id': int (optional),
            'send_to_all_devices': bool (optional, default: False),
            # Filter params (used when user_ids is empty and send_to_all_devices is False):
            'branch_ids': str (comma-separated),
            'user_type': str,
            'gender': str,
            'city': str (comma-separated city IDs or names),
            'nationality': str,
            'graduation_year_after': str,
            'graduation_year_before': str,
            'current_degree': str,
            'email_verified': str,
            'birthdate_after': str,
            'birthdate_before': str,
        }
        """
        try:
            user_ids = request.data.get('user_ids', [])
            title = request.data.get('title')
            message = request.data.get('message')
            notification_type = request.data.get('notification_type', 'info')
            content_type = request.data.get('content_type')
            object_id = request.data.get('object_id')
            send_to_all_devices = request.data.get('send_to_all_devices', False)

            if not title or not message:
                return Response(
                    {'error': 'title and message are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # If no user_ids provided, resolve from filter params or all users
            if not user_ids:
                qs = User.objects.filter(is_deleted=False, is_active=True)

                branch_ids = request.data.get('branch_ids')
                if branch_ids:
                    from niqabaty.models import Branch
                    branch_id_list = [int(id.strip()) for id in branch_ids.split(',') if id.strip().isdigit()]
                    if branch_id_list:
                        all_branch_ids = set(branch_id_list)
                        child_ids = Branch.objects.filter(parent_id__in=branch_id_list).values_list('id', flat=True)
                        all_branch_ids.update(child_ids)
                        qs = qs.filter(branches__id__in=all_branch_ids).distinct()

                user_type = request.data.get('user_type')
                if user_type:
                    qs = qs.filter(user_type=user_type)

                gender = request.data.get('gender')
                if gender:
                    qs = qs.filter(gender=gender)

                city = request.data.get('city')
                if city:
                    city_ids = [c.strip() for c in city.split(',') if c.strip()]
                    qs = qs.filter(city__name__in=city_ids)

                nationality = request.data.get('nationality')
                if nationality:
                    qs = qs.filter(nationality__name=nationality)

                graduation_year_after = request.data.get('graduation_year_after')
                if graduation_year_after:
                    qs = qs.filter(graduation_year__gte=int(graduation_year_after))

                graduation_year_before = request.data.get('graduation_year_before')
                if graduation_year_before:
                    qs = qs.filter(graduation_year__lte=int(graduation_year_before))

                current_degree = request.data.get('current_degree')
                if current_degree:
                    qs = qs.filter(current_degree__name=current_degree)

                email_verified = request.data.get('email_verified')
                if email_verified:
                    qs = qs.filter(email_verified=(email_verified.lower() == 'true'))

                birthdate_after = request.data.get('birthdate_after')
                if birthdate_after:
                    qs = qs.filter(birthdate__gte=birthdate_after)

                birthdate_before = request.data.get('birthdate_before')
                if birthdate_before:
                    qs = qs.filter(birthdate__lte=birthdate_before)

                user_ids = list(qs.values_list('id', flat=True))

            batch_id = uuid.uuid4()
            success, message_or_error = send_notification(
                user_ids=user_ids,
                title=title,
                message=message,
                notification_type=notification_type,
                content_type=content_type,
                object_id=object_id,
                send_to_all_devices=send_to_all_devices,
                created_by=request.user,
                batch_id=batch_id,
            )

            if success:
                return Response(
                    {
                        'status': 'success',
                        'message': message_or_error,
                        'batch_id': str(batch_id),
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': message_or_error},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get notification statistics for the current user.
        Returns: total, unread, read, by type
        """
        user_notifications = Notification.objects.filter(user=request.user)
        
        stats = {
            'total': user_notifications.count(),
            'unread': user_notifications.filter(is_read=False).count(),
            'read': user_notifications.filter(is_read=True).count(),
            'by_type': dict(
                user_notifications.values('notification_type').annotate(
                    count=Count('id')
                ).values_list('notification_type', 'count')
            ),
            'seen_count': SeenNotification.objects.filter(
                user=request.user
            ).count(),
        }
        
        return Response(stats, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """
        Resend a notification to the user (create a duplicate).
        """
        notification = self.get_object()
        
        try:
            success, message_or_error = send_notification(
                user_ids=[notification.user.id],
                title=notification.title,
                message=notification.message,
                notification_type=notification.notification_type,
                content_type=notification.content_type,
                object_id=notification.object_id,
                created_by=request.user
            )

            if success:
                # Get the last created notification to return
                new_notification = Notification.objects.filter(user=notification.user).latest('created_at')
                serializer = self.get_serializer(new_notification)
                return Response(
                    {
                        'status': 'success',
                        'message': 'Notification resent successfully',
                        'notification': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': message_or_error},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel/delete a notification (soft delete via is_deleted).
        """
        notification = self.get_object()
        
        try:
            notification.delete()  # Uses soft delete from BaseModel
            return Response(
                {
                    'status': 'success',
                    'message': 'Notification cancelled successfully'
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def aggregated(self, request):
        """
        Return notifications grouped by batch_id with recipient and seen counts.
        For superusers only.
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only superusers can view aggregated notifications'},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = Notification.objects.all()

        # Filter by source: system vs manual
        source = request.query_params.get('source')
        if source in ['system', 'manual']:
            queryset = queryset.filter(source=source)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(message__icontains=search)
            )

        target_user_id = request.query_params.get('target_user_id')
        if target_user_id:
            queryset = queryset.filter(user_id=target_user_id)

        branch_ids = request.query_params.get('branch_ids')
        if branch_ids:
            from niqabaty.models import Branch
            branch_id_list = [int(id.strip()) for id in branch_ids.split(',') if id.strip().isdigit()]
            if branch_id_list:
                all_branch_ids = set(branch_id_list)
                child_ids = Branch.objects.filter(parent_id__in=branch_id_list).values_list('id', flat=True)
                all_branch_ids.update(child_ids)
                queryset = queryset.filter(user__branches__id__in=all_branch_ids).distinct()

        # Advanced filters
        notification_type = request.query_params.get('notification_type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        send_to_all_devices = request.query_params.get('send_to_all_devices')
        if send_to_all_devices is not None:
            if send_to_all_devices.lower() == 'true':
                queryset = queryset.filter(send_to_all_devices=True)
            elif send_to_all_devices.lower() == 'false':
                queryset = queryset.filter(send_to_all_devices=False)

        created_after = request.query_params.get('created_after')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)

        created_before = request.query_params.get('created_before')
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        offset = (page - 1) * page_size

        ordering = request.query_params.get('ordering', '-latest_created_at')
        if ordering not in ['latest_created_at', '-latest_created_at', 'title', '-title', 'recipient_count', '-recipient_count', 'seen_count', '-seen_count']:
            ordering = '-latest_created_at'

        # Group by batch_id for batched sends, fallback to id for single sends
        aggregated_qs = (
            queryset
            .values('batch_id', 'title', 'message', 'notification_type', 'send_to_all_devices', 'created_by', 'source')
            .annotate(
                latest_id=Max('id'),
                recipient_count=Count('id', distinct=True),
                seen_count=Count('seen_by__user', distinct=True),
                latest_created_at=Max('created_at'),
            )
            .order_by(ordering, '-latest_id')
        )

        total = aggregated_qs.count()
        page_qs = list(aggregated_qs[offset:offset + page_size])

        results = []
        for group in page_qs:
            created_by_name = None
            if group['created_by']:
                try:
                    user_obj = User.objects.get(id=group['created_by'])
                    created_by_name = user_obj.full_name
                except User.DoesNotExist:
                    pass

            results.append({
                'id': group['latest_id'],
                'batch_id': str(group['batch_id']) if group['batch_id'] else None,
                'title': group['title'],
                'message': group['message'],
                'notification_type': group['notification_type'],
                'send_to_all_devices': group['send_to_all_devices'],
                'recipient_count': group['recipient_count'],
                'seen_count': group['seen_count'],
                'created_at': group['latest_created_at'],
                'created_by_name': created_by_name,
                'source': group['source'],
            })

        return Response({
            'count': total,
            'results': results,
        })

    @action(detail=False, methods=['post'])
    def delete_by_batch(self, request):
        """
        Soft-delete all notifications in a batch.
        """
        batch_id = request.data.get('batch_id')
        if not batch_id:
            return Response(
                {'error': 'batch_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            notifications = Notification.objects.filter(batch_id=batch_id)
            count = notifications.count()
            for n in notifications:
                n.delete()  # soft delete
            return Response(
                {'status': 'success', 'deleted_count': count},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def delivery_status(self, request, pk=None):
        """
        Get delivery status of a notification.
        If it has a batch_id, shows counts across all notifications in the batch.
        """
        notification = self.get_object()
        
        try:
            if notification.batch_id:
                batch_notifications = Notification.objects.filter(batch_id=notification.batch_id)
                total_recipients = batch_notifications.count()
                seen_count = SeenNotification.objects.filter(
                    notification__in=batch_notifications
                ).values('user').distinct().count()
            else:
                total_recipients = 1
                seen_count = SeenNotification.objects.filter(
                    notification=notification
                ).count()

            return Response(
                {
                    'batch_id': str(notification.batch_id) if notification.batch_id else None,
                    'total_recipients': total_recipients,
                    'delivered': total_recipients,
                    'seen': seen_count,
                    'pending': total_recipients - seen_count,
                    'failed': 0
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
