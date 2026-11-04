import 'package:json_annotation/json_annotation.dart';

part 'library_item.g.dart';

@JsonSerializable()
class LibraryItem {
  final int id;
  final String title;
  final String? description;
  final String? category;
  @JsonKey(name: 'item_type')
  final String itemType;
  @JsonKey(name: 'item_type_display')
  final String itemTypeDisplay;
  final String? file;
  @JsonKey(name: 'file_url')
  final String? fileUrl;
  @JsonKey(name: 'external_link')
  final String? externalLink;
  final String? thumbnail;
  @JsonKey(name: 'thumbnail_url')
  final String? thumbnailUrl;
  @JsonKey(name: 'author_name')
  final String? authorName;
  @JsonKey(name: 'publication_year')
  final int? publicationYear;
  @JsonKey(name: 'download_count')
  final int downloadCount;
  @JsonKey(name: 'view_count')
  final int viewCount;
  @JsonKey(name: 'is_public')
  final bool isPublic;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  LibraryItem({
    required this.id,
    required this.title,
    this.description,
    this.category,
    required this.itemType,
    required this.itemTypeDisplay,
    this.file,
    this.fileUrl,
    this.externalLink,
    this.thumbnail,
    this.thumbnailUrl,
    this.authorName,
    this.publicationYear,
    required this.downloadCount,
    required this.viewCount,
    required this.isPublic,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LibraryItem.fromJson(Map<String, dynamic> json) => _$LibraryItemFromJson(json);
  Map<String, dynamic> toJson() => _$LibraryItemToJson(this);
}
