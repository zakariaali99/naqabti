export default {
  // Page titles
  title: "Posts & News",
  createTitle: "Create New Post",
  editTitle: "Edit Post",
  createSubtitle: "Fill in the details to create a new post",
  editSubtitle: "Update post details",

  // Stats
  totalPosts: "Total: {{count}} posts",

  // Buttons
  createPost: "Create Post",
  updatePost: "Update Post",
  cancel: "Cancel",
  add: "Add",

  // Table columns
  table: {
    title: "Title",
    type: "Type",
    status: "Status",
    author: "Author",
    published: "Published",
    views: "Views",
    actions: "Actions",
  },

  // Filters
  filters: {
    search: "Search posts...",
    allTypes: "All Types",
    allStatus: "All Status",
  },

  // Post types
  types: {
    news: "News",
    announcement: "Announcement",
    article: "Article",
  },

  // Post status
  status: {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  },

  // Actions
  actions: {
    edit: "Edit",
    publish: "Publish",
    archive: "Archive",
    feature: "Feature",
    unfeature: "Unfeature",
    delete: "Delete",
  },

  // Form sections
  form: {
    basicInfo: "Basic Information",
    postSettings: "Post Settings",
    featuredImage: "Featured Image",
    tags: "Tags",

    // Fields
    titleLabel: "Title",
    titlePlaceholder: "Enter post title",
    excerptLabel: "Excerpt",
    excerptPlaceholder: "Short summary of the post",
    contentLabel: "Content",
    contentPlaceholder: "Write your post content here...",
    postTypeLabel: "Post Type",
    postTypePlaceholder: "Select post type",
    statusLabel: "Status",
    statusPlaceholder: "Select status",
    featuredPost: "Featured Post",
    addTag: "Add a tag",

    // Image upload
    uploadImage: "Upload a featured image",
    chooseImage: "Choose Image",

    // Validation
    titleRequired: "Title is required",
    contentRequired: "Content is required",
  },

  // Badges
  featured: "Featured",

  // Empty state
  noPostsFound: "No posts found",

  // Delete modal
  deletePost: "Delete Post",
  deleteConfirm: "Are you sure you want to delete this post?",

  // Misc
  views: "{{count}} views",
  loading: "Loading...",
} as const;
