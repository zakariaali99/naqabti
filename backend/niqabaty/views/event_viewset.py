from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from niqabaty.models import Event
from niqabaty.serializers import EventSerializer, EventListSerializer
from niqabaty.utils.firebase import send_fcm_topic_message
from niqabaty.utils.notifications import send_notification
import logging

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_featured', 'author']
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['created_at', 'event_date', 'views_count', 'title']
    ordering = ['-event_date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status='published')
        return queryset

    def perform_create(self, serializer):
        event = serializer.save(
            created_by=self.request.user,
            author=self.request.user,
        )
        if event.status == 'published' and not event.notification_sent:
            self._send_notification(event)

    def perform_update(self, serializer):
        old = self.get_object()
        was_sent = old.notification_sent
        event = serializer.save(updated_by=self.request.user)
        if event.status == 'published' and not was_sent:
            self._send_notification(event)

    def _send_notification(self, event):
        try:
            send_fcm_topic_message(
                topic='general',
                title=f"New Event: {event.title}",
                body=event.excerpt or event.title,
                data={
                    'type': 'new_event',
                    'event_id': str(event.id),
                }
            )
            event.notification_sent = True
            event.save(update_fields=['notification_sent'])
        except Exception as e:
            logger.error(f"Failed to send notification for event {event.id}: {e}")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        event = self.get_object()
        was_sent = event.notification_sent
        event.status = 'published'
        if not event.published_at:
            event.published_at = timezone.now()
        event.save()
        if not was_sent:
            self._send_notification(event)
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unpublish(self, request, pk=None):
        event = self.get_object()
        event.status = 'draft'
        event.save()
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def archive(self, request, pk=None):
        event = self.get_object()
        event.status = 'archived'
        event.save()
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        event = self.get_object()
        event.views_count += 1
        event.save(update_fields=['views_count'])
        return Response({'views_count': event.views_count})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_featured(self, request, pk=None):
        event = self.get_object()
        event.is_featured = not event.is_featured
        event.save(update_fields=['is_featured'])
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        events = self.get_queryset().filter(is_featured=True, status='published')
        page = self.paginate_queryset(events)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_notification_action(self, request, pk=None):
        event = self.get_object()
        user_ids = request.data.get('user_ids', [])
        send_to_all_devices = request.data.get('send_to_all_devices', False)
        title = request.data.get('title', f"Event: {event.title}")
        message = request.data.get('message', event.excerpt or event.title)
        notification_type = request.data.get('notification_type', 'info')

        success, msg = send_notification(
            user_ids=user_ids,
            title=title,
            message=message,
            send_to_all_devices=send_to_all_devices,
            notification_type=notification_type,
            content_type='event',
            object_id=event.id,
            created_by=request.user,
        )

        if success:
            return Response({'status': 'success', 'message': msg})
        return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'published': queryset.filter(status='published').count(),
            'draft': queryset.filter(status='draft').count(),
            'archived': queryset.filter(status='archived').count(),
            'featured': queryset.filter(is_featured=True).count(),
        })
