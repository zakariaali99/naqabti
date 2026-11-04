from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from niqabaty.models import Post
from niqabaty.serializers import PostSerializer, PostListSerializer
from niqabaty.utils.firebase import send_fcm_topic_message
from niqabaty.utils.notifications import send_notification
import logging

logger = logging.getLogger(__name__)


def send_post_notification(post):
    """
    Send a push notification to all users when a post is published for the first time.
    Uses FCM topic messaging to reach all subscribed devices.
    """
    try:
        # Prepare notification data
        post_type_display = dict(Post.POST_TYPE_CHOICES).get(post.post_type, 'Post')
        
        send_fcm_topic_message(
            topic='general',
            title=f"New {post_type_display}: {post.title}",
            body=post.excerpt if post.excerpt else post.content[:200] + '...' if len(post.content) > 200 else post.content,
            data={
                'type': 'new_post',
                'post_id': str(post.id),
                'post_type': post.post_type,
            }
        )
        
        # Mark notification as sent
        post.notification_sent = True
        post.save(update_fields=['notification_sent'])
        
        logger.info(f"Push notification sent for post: {post.id} - {post.title}")
        return True
    except Exception as e:
        logger.error(f"Failed to send push notification for post {post.id}: {str(e)}")
        return False


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing posts and news.
    
    Provides CRUD operations and additional actions:
    - List/retrieve posts (public can view published posts)
    - Create/update/delete posts (authenticated users only)
    - Publish/unpublish posts
    - Featured posts
    - Increment view count
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['post_type', 'status', 'is_featured', 'author']
    search_fields = ['title', 'content', 'excerpt', 'tags']
    ordering_fields = ['created_at', 'published_at', 'views_count', 'title']
    ordering = ['-published_at', '-created_at']

    def get_serializer_class(self):
        """Use lightweight serializer for list view"""
        if self.action == 'list':
            return PostListSerializer
        return PostSerializer

    def get_queryset(self):
        """
        Filter queryset based on user authentication.
        Public users can only see published posts.
        Authenticated users can see all posts.
        """
        queryset = super().get_queryset()
        
        # If user is not authenticated, only show published posts
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status='published')
        
        return queryset

    def perform_create(self, serializer):
        """Set created_by and author when creating a post, send notification if published"""
        post = serializer.save(
            created_by=self.request.user,
            author=self.request.user
        )
        # Send notification if post is being published directly
        if post.status == 'published' and not post.notification_sent:
            send_post_notification(post)

    def perform_update(self, serializer):
        """Set updated_by when updating a post, send notification if newly published"""
        # Get the old status before update
        old_post = self.get_object()
        was_published_before = old_post.notification_sent
        
        post = serializer.save(updated_by=self.request.user)
        
        # Send notification if post is being published for the first time
        if post.status == 'published' and not was_published_before:
            send_post_notification(post)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """Publish a post and send notification if not published before"""
        post = self.get_object()
        was_published_before = post.notification_sent
        
        post.status = 'published'
        if not post.published_at:
            post.published_at = timezone.now()
        post.save()
        
        # Send notification if this is the first time publishing
        if not was_published_before:
            send_post_notification(post)
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unpublish(self, request, pk=None):
        """Unpublish a post (set to draft)"""
        post = self.get_object()
        post.status = 'draft'
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def archive(self, request, pk=None):
        """Archive a post"""
        post = self.get_object()
        post.status = 'archived'
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Increment the view count for a post"""
        post = self.get_object()
        post.views_count += 1
        post.save(update_fields=['views_count'])
        return Response({'views_count': post.views_count})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_featured(self, request, pk=None):
        """Toggle the featured status of a post"""
        post = self.get_object()
        post.is_featured = not post.is_featured
        post.save(update_fields=['is_featured'])
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get all featured posts"""
        featured_posts = self.get_queryset().filter(is_featured=True, status='published')
        page = self.paginate_queryset(featured_posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(featured_posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get posts filtered by type"""
        post_type = request.query_params.get('type', 'news')
        posts = self.get_queryset().filter(post_type=post_type, status='published')
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_notification_action(self, request, pk=None):
        """
        Send a notification about this post to specific users or all users.
        """
        post = self.get_object()
        user_ids = request.data.get('user_ids', [])
        send_to_all_devices = request.data.get('send_to_all_devices', False)
        title = request.data.get('title', f"New Post: {post.title}")
        message = request.data.get('message', post.excerpt[:200] if post.excerpt else post.title)
        notification_type = request.data.get('notification_type', 'info')

        success, message_or_error = send_notification(
            user_ids=user_ids,
            title=title,
            message=message,
            send_to_all_devices=send_to_all_devices,
            notification_type=notification_type,
            content_type='post',
            object_id=post.id,
            created_by=request.user
        )

        if success:
            return Response({'status': 'success', 'message': message_or_error})
        else:
            return Response({'error': message_or_error}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about posts"""
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'published': queryset.filter(status='published').count(),
            'draft': queryset.filter(status='draft').count(),
            'archived': queryset.filter(status='archived').count(),
            'featured': queryset.filter(is_featured=True).count(),
            'by_type': {
                'news': queryset.filter(post_type='news').count(),
                'announcement': queryset.filter(post_type='announcement').count(),
                'article': queryset.filter(post_type='article').count(),
            }
        }
        return Response(stats)
