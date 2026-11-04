import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Textarea,
} from "@heroui/react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import professionalDevelopmentApi from "@/api/professionalDevelopmentApi";
import { ProfessionalDevelopmentCategory } from "@/models/professionalDevelopment";

export default function ProfessionalDevelopmentCategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<
    ProfessionalDevelopmentCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<ProfessionalDevelopmentCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await professionalDevelopmentApi.getCategories();

      setCategories(response.data.results);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category?: ProfessionalDevelopmentCategory) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setSelectedCategory(null);
      setFormData({ name: "", description: "" });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      if (selectedCategory) {
        await professionalDevelopmentApi.updateCategory(
          selectedCategory.id,
          formData,
        );
      } else {
        await professionalDevelopmentApi.createCategory(formData);
      }
      onClose();
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      setActionLoading(true);
      await professionalDevelopmentApi.deleteCategory(selectedCategory.id);
      onDeleteClose();
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t("professionalDevelopment.categories")}
          </h1>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => handleOpenModal()}
          >
            {t("professionalDevelopment.addCategory")}
          </Button>
        </div>

        <Card>
          <CardBody>
            {loading ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                {t("professionalDevelopment.noCategoriesFound")}
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="text-lg font-bold">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(category)}
                      >
                        <FiEdit />
                      </Button>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => {
                          setSelectedCategory(category);
                          onDeleteOpen();
                        }}
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Add/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>
              {selectedCategory
                ? t("professionalDevelopment.editCategory")
                : t("professionalDevelopment.addCategory")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                isRequired
                label={t("professionalDevelopment.name")}
                value={formData.name}
                onValueChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
              />
              <Textarea
                label={t("professionalDevelopment.description")}
                minRows={3}
                value={formData.description}
                onValueChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("professionalDevelopment.cancel")}
              </Button>
              <Button
                color="primary"
                isLoading={actionLoading}
                onPress={handleSubmit}
              >
                {t("professionalDevelopment.save")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>
              {t("professionalDevelopment.deleteCategory")}
            </ModalHeader>
            <ModalBody>
              {t("professionalDevelopment.confirmDeleteCategory", {
                name: selectedCategory?.name,
              })}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteClose}>
                {t("professionalDevelopment.cancel")}
              </Button>
              <Button
                color="danger"
                isLoading={actionLoading}
                onPress={handleDelete}
              >
                {t("professionalDevelopment.delete")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
