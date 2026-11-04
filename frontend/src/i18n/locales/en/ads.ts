export default {
  title: "Ad Campaigns",
  createTitle: "New Ad Campaign",
  editTitle: "Edit Ad Campaign",
  totalCount: "Total campaigns: {{count}}",

  create: "Create Ad Campaign",
  update: "Save Campaign",
  submit: "Launch Campaign",
  noCampaignsFound: "No campaigns found",
  deleteTitle: "Delete Campaign",

  steps: {
    info: "Info",
    targeting: "Targeting",
    preview: "Estimation",
  },

  status: {
    all: "All Statuses",
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  },

  filters: {
    search: "Search campaigns...",
    status: "Filter by status",
  },

  table: {
    title: "Campaign Title",
    advertiser: "Advertiser",
    status: "Status",
    targeting: "Targeting",
    audience: "Audience Size",
    views: "Views",
    publishedAt: "Published Date",
    actions: "Actions",
  },

  actions: {
    publish: "Publish",
    unpublish: "Set to Draft",
    archive: "Archive",
    analytics: "View Analytics",
    delete: "Delete",
  },

  form: {
    subtitle: "Configure target criteria and premium styling for your campaign",
    general: "General Campaign Information",
    title: "Campaign Title",
    titlePlaceholder: "E.g. Special Cardiology Workshop Offer",
    content: "Ad Content",
    contentPlaceholder: "Write the full description/body message...",
    status: "Campaign Status",
    featuredImage: "Featured Banner Image",
    uploadClick: "Click or Drag to Upload Ad Banner Image",
    targetingTitle: "Define Target Audience",
    targetingDesc: "Filter down which syndicate members should see your campaign. Leaving a criteria blank means targeting all members under that category.",
    branches: "Target Branches",
    allBranches: "All Branches",
    cities: "Target Cities",
    allCities: "All Cities",
    specialties: "Target Specialties",
    allSpecialties: "All Specialties",
    realtimeAudience: "Current Projected Reach",
    calculatedBasedTarget: "Updated dynamically as selections change",
    members: "doctors",
    reviewTitle: "Campaign Review & Projected Audience Details",
  },

  review: {
    titleLabel: "Campaign Title",
    contentLabel: "Body Message",
    banner: "Campaign Banner",
    estimatedAudience: "Expected Audience Reach",
    audienceDisclaimer: "Total unique registered physicians matching targeting filters",
    breakdownTitle: "Audience Breakdown",
    byBranch: "Top Targeted Branches",
    byCity: "Top Targeted Cities",
  },

  banner: {
    noAds: "No active campaigns",
    viewDetails: "View Details",
    title: "Advertisements",
  },
} as const;
