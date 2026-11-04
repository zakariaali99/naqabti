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
import { ProfessionalDevelopmentType } from "@/models/professionalDevelopment";

export default function ProfessionalDevelopmentTypesPage() {
  const { t } = useTranslation();
  const [types, setTypes] = useState<ProfessionalDevelopmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] =
    useState<ProfessionalDevelopmentType | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const response = await professionalDevelopmentApi.getTypes();

      setTypes(response.data.results);
    } catch (error) {
      console.error("Failed to fetch types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenModal = (type?: ProfessionalDevelopmentType) => {
    if (type) {
      setSelectedType(type);
      setFormData({ name: type.name, description: type.description || "" });
    } else {
      setSelectedType(null);
      setFormData({ name: "", description: "" });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      if (selectedType) {
        await professionalDevelopmentApi.updateType(selectedType.id, formData);
      } else {
        await professionalDevelopmentApi.createType(formData);
      }
      onClose();
      fetchTypes();
    } catch (error) {
      console.error("Failed to save type:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    try {
      setActionLoading(true);
      await professionalDevelopmentApi.deleteType(selectedType.id);
      onDeleteClose();
      fetchTypes();
    } catch (error) {
      console.error("Failed to delete type:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t("professionalDevelopment.types")}
          </h1>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => handleOpenModal()}
          >
            {t("professionalDevelopment.addType")}
          </Button>
        </div>

        <Card>
          <CardBody>
            {loading ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : types.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                {t("professionalDevelopment.noTypesFound")}
              </div>
            ) : (
              <div className="space-y-4">
                {types.map((type) => (
                  <div
                    key={type.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      {type.description && (
                        <p className="text-sm text-gray-500">
                          {type.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(type)}
                      >
                        <FiEdit />
                      </Button>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => {
                          setSelectedType(type);
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
              {selectedType
                ? t("professionalDevelopment.editType")
                : t("professionalDevelopment.addType")}
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
            <ModalHeader>{t("professionalDevelopment.deleteType")}</ModalHeader>
            <ModalBody>
              {t("professionalDevelopment.confirmDeleteType", {
                name: selectedType?.name,
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
