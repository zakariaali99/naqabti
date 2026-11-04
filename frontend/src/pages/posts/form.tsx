import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Chip,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiImage, FiX } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import postsApi from "@/api/postsApi";
import { PostCreateInput, PostType, PostStatus } from "@/models/posts";

export default function PostFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryParams = new URLSearchParams(window.location.search);
  const isViewMode = queryParams.get("view") === "true" || (!!id && !window.location.pathname.endsWith("/edit"));
  const isEditMode = !!id && !isViewMode;

  // Form state
  const [formData, setFormData] = useState<PostCreateInput>({
    title: "",
    content: "",
    excerpt: "",
    post_type: "news",
    status: "draft",
    is_featured: false,
    tags: [],
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load post data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const response = await postsApi.getById(Number(id));
          const post = response.data;

          setFormData({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || "",
            post_type: post.post_type,
            status: post.status,
            is_featured: post.is_featured,
            tags: post.tags || [],
          });

          if (post.featured_image) {
            setFeaturedImagePreview(post.featured_image);
          }
        } catch (error) {
          console.error("Failed to fetch post:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [id, isEditMode]);

  // Handle form field changes
  const handleInputChange = (field: keyof PostCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setFeaturedImage(null);
    setFeaturedImagePreview("");
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t("posts.form.titleRequired");
    }
    if (!formData.content.trim()) {
      newErrors.content = t("posts.form.contentRequired");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaveLoading(true);

      if (isEditMode && id) {
        // Update existing post
        if (featuredImage) {
          await postsApi.updateWithImage(Number(id), {
            ...formData,
            featured_image: featuredImage,
          });
        } else {
          await postsApi.patch(Number(id), formData);
        }
      } else {
        // Create new post
        if (featuredImage) {
          await postsApi.createWithImage({
            ...formData,
            featured_image: featuredImage,
          });
        } else {
          await postsApi.create(formData);
        }
      }

      navigate("/posts");
    } catch (error: any) {
      console.error("Failed to save post:", error);

      // Handle API validation errors
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};

        Object.keys(error.response.data).forEach((key) => {
          if (Array.isArray(error.response.data[key])) {
            apiErrors[key] = error.response.data[key][0];
          } else {
            apiErrors[key] = error.response.data[key];
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-64">
          <div>{t("posts.loading")}</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button isIconOnly variant="light" onPress={() => navigate("/posts")}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isViewMode ? t("posts.viewTitle", "View Post") : isEditMode ? t("posts.editTitle") : t("posts.createTitle")}
            </h1>
            <p className="text-default-600 text-sm">
              {isViewMode ? t("posts.viewSubtitle", "Read post details") : isEditMode ? t("posts.editSubtitle") : t("posts.createSubtitle")}
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("posts.form.basicInfo")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
               <Input
                isRequired
                disabled={isViewMode}
                errorMessage={errors.title}
                isInvalid={!!errors.title}
                label={t("posts.form.titleLabel")}
                placeholder={t("posts.form.titlePlaceholder")}
                value={formData.title}
                onValueChange={(value) => handleInputChange("title", value)}
              />

              <Textarea
                disabled={isViewMode}
                label={t("posts.form.excerptLabel")}
                minRows={2}
                placeholder={t("posts.form.excerptPlaceholder")}
                value={formData.excerpt}
                onValueChange={(value) => handleInputChange("excerpt", value)}
              />

              <Textarea
                isRequired
                disabled={isViewMode}
                errorMessage={errors.content}
                isInvalid={!!errors.content}
                label={t("posts.form.contentLabel")}
                minRows={10}
                placeholder={t("posts.form.contentPlaceholder")}
                value={formData.content}
                onValueChange={(value) => handleInputChange("content", value)}
              />
            </CardBody>
          </Card>

          {/* Post Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("posts.form.postSettings")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
               <Select
                disabled={isViewMode}
                label={t("posts.form.postTypeLabel")}
                placeholder={t("posts.form.postTypePlaceholder")}
                selectedKeys={formData.post_type ? [formData.post_type] : []}
                onSelectionChange={(keys) => {
                  const type = Array.from(keys)[0] as PostType;

                  handleInputChange("post_type", type);
                }}
              >
                <SelectItem key="news">{t("posts.types.news")}</SelectItem>
                <SelectItem key="announcement">
                  {t("posts.types.announcement")}
                </SelectItem>
                <SelectItem key="article">
                  {t("posts.types.article")}
                </SelectItem>
              </Select>

              <Select
                disabled={isViewMode}
                label={t("posts.form.statusLabel")}
                placeholder={t("posts.form.statusPlaceholder")}
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => {
                  const status = Array.from(keys)[0] as PostStatus;

                  handleInputChange("status", status);
                }}
              >
                <SelectItem key="draft">{t("posts.status.draft")}</SelectItem>
                <SelectItem key="published">
                  {t("posts.status.published")}
                </SelectItem>
                <SelectItem key="archived">
                  {t("posts.status.archived")}
                </SelectItem>
              </Select>

              <Switch
                isDisabled={isViewMode}
                isSelected={formData.is_featured}
                onValueChange={(checked) =>
                  handleInputChange("is_featured", checked)
                }
              >
                {t("posts.form.featuredPost")}
              </Switch>
            </CardBody>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("posts.form.featuredImage")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
               {featuredImagePreview ? (
                <div className="relative">
                  <img
                    alt="Featured"
                    className="w-full h-64 object-cover rounded-lg"
                    src={featuredImagePreview}
                  />
                  {!isViewMode && (
                    <Button
                      isIconOnly
                      className="absolute top-2 right-2"
                      color="danger"
                      size="sm"
                      onPress={handleRemoveImage}
                    >
                      <FiX />
                    </Button>
                  )}
                </div>
              ) : (
                !isViewMode && (
                  <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center">
                    <FiImage className="mx-auto text-4xl text-default-400 mb-2" />
                    <p className="text-default-600 mb-4">
                      {t("posts.form.uploadImage")}
                    </p>
                    <input
                      accept="image/*"
                      className="hidden"
                      id="featured-image"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <Button
                      as="label"
                      color="primary"
                      htmlFor="featured-image"
                      variant="flat"
                    >
                      {t("posts.form.chooseImage")}
                    </Button>
                  </div>
                )
              )}
            </CardBody>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("posts.form.tags")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
               {!isViewMode && (
                <div className="flex gap-2">
                  <Input
                    placeholder={t("posts.form.addTag")}
                    value={tagInput}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    onValueChange={setTagInput}
                  />
                  <Button onPress={handleAddTag}>{t("posts.add")}</Button>
                </div>
              )}

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      variant="flat"
                      onClose={isViewMode ? undefined : () => handleRemoveTag(tag)}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Form Actions */}
           <div className="flex gap-4 justify-end">
            <Button
              disabled={saveLoading}
              variant="light"
              onPress={() => navigate("/posts")}
            >
              {isViewMode ? t("common.back", "Back") : t("posts.cancel")}
            </Button>
            {!isViewMode && (
              <Button
                color="primary"
                isLoading={saveLoading}
                startContent={<FiSave />}
                type="submit"
              >
                {isEditMode ? t("posts.updatePost") : t("posts.createPost")}
              </Button>
            )}
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
}
