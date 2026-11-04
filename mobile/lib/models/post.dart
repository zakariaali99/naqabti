import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'post.g.dart';

/// Post type enum
enum PostType {
  @JsonValue('news')
  news,
  @JsonValue('announcement')
  announcement,
  @JsonValue('article')
  article,
  @JsonValue('event')
  event,
}

/// Post status enum
enum PostStatus {
  @JsonValue('draft')
  draft,
  @JsonValue('published')
  published,
  @JsonValue('archived')
  archived,
}

@JsonSerializable()
class Post {
  final int id;
  final String title;
  final String? content;
  final String? excerpt;
  @JsonKey(name: 'post_type')
  final PostType postType;
  final PostStatus status;
  @JsonKey(name: 'featured_image')
  final String? featuredImage;
  final User? author;
  @JsonKey(name: 'published_at')
  final DateTime? publishedAt;
  @JsonKey(name: 'views_count')
  final int viewsCount;
  @JsonKey(name: 'is_featured')
  final bool isFeatured;
  final List<String>? tags;
  @JsonKey(name: 'meta_data')
  final Map<String, dynamic>? metaData;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  const Post({
    required this.id,
    required this.title,
    required this.content,
    this.excerpt,
    required this.postType,
    required this.status,
    this.featuredImage,
    this.author,
    this.publishedAt,
    this.viewsCount = 0,
    this.isFeatured = false,
    this.tags,
    this.metaData,
    this.createdAt,
    this.updatedAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);

  Map<String, dynamic> toJson() => _$PostToJson(this);

  /// Get display name for post type
  String get postTypeDisplay {
    switch (postType) {
      case PostType.news:
        return 'News';
      case PostType.announcement:
        return 'Announcement';
      case PostType.article:
        return 'Article';
      case PostType.event:
        return 'Event';
    }
  }

  /// Get display name for status
  String get statusDisplay {
    switch (status) {
      case PostStatus.draft:
        return 'Draft';
      case PostStatus.published:
        return 'Published';
      case PostStatus.archived:
        return 'Archived';
    }
  }
}
