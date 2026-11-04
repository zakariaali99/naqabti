import shutil

from django.conf import settings
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from ..filters import LibraryItemFilter
from ..models.library import LibraryItem, LibraryUploadSession
from ..serializers.library import LibraryItemSerializer

class LibraryItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing electronic library items.

    - Authenticated users can create items (auto-tagged to their branch).
    - Users see items from their branches + legacy items without a branch.
    - Staff can see everything.
    """
    queryset = LibraryItem.objects.all()
    serializer_class = LibraryItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LibraryItemFilter
    search_fields = ['title', 'description', 'author_name']
    ordering_fields = ['created_at', 'download_count', 'view_count', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset().select_related('created_by')
        user = self.request.user
        if not user.is_authenticated:
            return queryset.filter(is_public=True, branch__isnull=False)
        if not user.is_staff:
            user_branches = list(user.branches.values_list('id', flat=True))
            from django.db.models import Q
            queryset = queryset.filter(
                Q(branch_id__in=user_branches) | Q(branch__isnull=True)
            )
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        branch = user.branches.first()
        serializer.save(branch=branch, created_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def increment_download(self, request, pk=None):
        """Track file downloads"""
        item = self.get_object()
        item.download_count += 1
        item.save(update_fields=['download_count'])
        return Response({'download_count': item.download_count})

    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        """Track views of individual items"""
        item = self.get_object()
        item.view_count += 1
        item.save(update_fields=['view_count'])
        return Response({'view_count': item.view_count})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about the library (Admin only)"""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        queryset = LibraryItem.objects.all()
        stats = {
            'total': queryset.count(),
            'by_type': {
                'pdf': queryset.filter(item_type='pdf').count(),
                'image': queryset.filter(item_type='image').count(),
                'video': queryset.filter(item_type='video').count(),
                'link': queryset.filter(item_type='link').count(),
            },
            'total_downloads': sum(queryset.values_list('download_count', flat=True)),
            'total_views': sum(queryset.values_list('view_count', flat=True)),
        }
        return Response(stats)

    @action(detail=False, methods=['post'])
    def start_upload(self, request):
        """Start a chunked upload session for a PDF file."""
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        file_name = request.data.get('file_name', '')
        file_size = request.data.get('file_size')
        total_chunks = request.data.get('total_chunks')

        if not file_name or not file_size or not total_chunks:
            return Response({'error': 'file_name, file_size, and total_chunks are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        file_size = int(file_size)
        total_chunks = int(total_chunks)

        if not file_name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files are allowed'},
                            status=status.HTTP_400_BAD_REQUEST)

        if file_size > settings.LIBRARY_MAX_UPLOAD_SIZE:
            return Response({
                'error': f'File size must be under {settings.LIBRARY_MAX_UPLOAD_SIZE // (1024*1024)}MB'
            }, status=status.HTTP_400_BAD_REQUEST)

        specialty_id = request.data.get('specialty')
        if specialty_id:
            try:
                from ..models.doctor_specialty import DoctorSpecialty
                specialty = DoctorSpecialty.objects.get(id=specialty_id)
            except DoctorSpecialty.DoesNotExist:
                specialty = None
        else:
            specialty = None

        session = LibraryUploadSession.objects.create(
            created_by=user,
            file_name=file_name,
            file_size=file_size,
            total_chunks=total_chunks,
            title=request.data.get('title', file_name),
            description=request.data.get('description', ''),
            category=request.data.get('category', ''),
            author_name=request.data.get('author_name', ''),
            publication_year=request.data.get('publication_year'),
            is_public=request.data.get('is_public', True),
            specialty=specialty,
        )

        chunk_dir = settings.MEDIA_ROOT / 'library' / 'chunks' / str(session.upload_id)
        chunk_dir.mkdir(parents=True, exist_ok=True)

        return Response({'upload_id': str(session.upload_id)}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_chunk(self, request):
        """Upload a single chunk of a file."""
        upload_id = request.data.get('upload_id')
        chunk_index = request.data.get('chunk_index')
        chunk_file = request.FILES.get('chunk')

        if not upload_id or chunk_index is None or not chunk_file:
            return Response({'error': 'upload_id, chunk_index, and chunk are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            session = LibraryUploadSession.objects.get(upload_id=upload_id)
        except LibraryUploadSession.DoesNotExist:
            return Response({'error': 'Upload session not found'}, status=status.HTTP_404_NOT_FOUND)

        if session.completed:
            return Response({'error': 'Upload session is already completed'},
                            status=status.HTTP_400_BAD_REQUEST)

        chunk_index = int(chunk_index)
        chunk_dir = settings.MEDIA_ROOT / 'library' / 'chunks' / str(session.upload_id)
        chunk_path = chunk_dir / f'chunk_{chunk_index}'

        with open(chunk_path, 'wb') as dest:
            for chunk in chunk_file.chunks():
                dest.write(chunk)

        session.received_chunks += 1
        session.save(update_fields=['received_chunks'])

        return Response({
            'received_chunks': session.received_chunks,
            'total_chunks': session.total_chunks,
        })

    @action(detail=False, methods=['post'])
    def finalize_upload(self, request):
        """Assemble all chunks and create the LibraryItem."""
        upload_id = request.data.get('upload_id')
        if not upload_id:
            return Response({'error': 'upload_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = LibraryUploadSession.objects.get(upload_id=upload_id)
        except LibraryUploadSession.DoesNotExist:
            return Response({'error': 'Upload session not found'}, status=status.HTTP_404_NOT_FOUND)

        if session.completed:
            return Response({'error': 'Upload session is already completed'},
                            status=status.HTTP_400_BAD_REQUEST)

        if session.received_chunks != session.total_chunks:
            return Response({
                'error': f'Not all chunks received ({session.received_chunks}/{session.total_chunks})'
            }, status=status.HTTP_400_BAD_REQUEST)

        chunk_dir = settings.MEDIA_ROOT / 'library' / 'chunks' / str(session.upload_id)
        if not chunk_dir.exists():
            return Response({'error': 'Chunk directory not found'}, status=status.HTTP_404_NOT_FOUND)

        # Assemble chunks into final file
        final_dir = settings.MEDIA_ROOT / 'library' / 'files'
        final_dir.mkdir(parents=True, exist_ok=True)
        final_filename = f'{session.upload_id}.pdf'
        final_path = final_dir / final_filename

        try:
            with open(final_path, 'wb') as dest:
                for i in range(session.total_chunks):
                    chunk_path = chunk_dir / f'chunk_{i}'
                    if not chunk_path.exists():
                        raise FileNotFoundError(f'Chunk {i} not found at {chunk_path}')
                    with open(chunk_path, 'rb') as src:
                        shutil.copyfileobj(src, dest)
        except Exception as e:
            return Response({'error': f'Failed to assemble chunks: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create LibraryItem
        user = request.user
        branch = user.branches.first()
        item = LibraryItem(
            title=session.title,
            description=session.description,
            category=session.category,
            item_type='pdf',
            author_name=session.author_name,
            publication_year=session.publication_year,
            is_public=session.is_public,
            branch=branch,
            specialty=session.specialty,
            created_by=user,
        )
        item.file.name = f'library/files/{final_filename}'
        item.save()

        # Mark session as completed and clean up
        session.completed = True
        session.save(update_fields=['completed'])
        shutil.rmtree(chunk_dir, ignore_errors=True)

        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
