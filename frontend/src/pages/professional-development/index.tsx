import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
    Select,
    SelectItem,
    Switch,
    Image,
} from '@heroui/react';                                                                                 
import { FiEdit, FiFilter, FiPlus, FiTrash2, FiEye, FiCalendar, FiArrowRight, FiAward, FiSearch } from 'react-icons/fi';
import DefaultLayout from '@/layouts/default';
import professionalDevelopmentApi from '@/api/professionalDevelopmentApi';
import {
    ProfessionalDevelopment,
    ProfessionalDevelopmentType,
    ProfessionalDevelopmentCategory,
} from '@/models/professionalDevelopment';
import { formatDate } from '@/misc/formatDate';
import { formatCurrency } from '@/misc/formatCurrency';
import { FiTag, FiDollarSign } from 'react-icons/fi';

export default function ProfessionalDevelopmentPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProfessionalDevelopment[]>([]);
  const [types, setTypes] = useState<ProfessionalDevelopmentType[]>([]);
  const [categories, setCategories] = useState<
    ProfessionalDevelopmentCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] =
    useState<ProfessionalDevelopment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [ordering, setOrdering] = useState("name");

  // Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [dateFromFilter, setDateFromFilter] = useState<string>('');
    const [dateToFilter, setDateToFilter] = useState<string>('');

  // Form Data
  const [formData, setFormData] = useState<Partial<ProfessionalDevelopment>>({
    title: "",
    content: "",
    type: undefined,
    category: undefined,
    date_from: "",
    date_to: "",
    price: 0,
    can_register: true,
    status: "active",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, typesRes, categoriesRes] = await Promise.all([
        professionalDevelopmentApi.getAll({
          ordering,
          type: selectedTypeFilter || undefined,
          category: selectedCategoryFilter || undefined,
                    search: searchQuery || undefined,
                    date_from: dateFromFilter || undefined,
                    date_to: dateToFilter || undefined,
        }),
        professionalDevelopmentApi.getTypes(),
        professionalDevelopmentApi.getCategories(),
      ]);

      setItems(itemsRes.data.results);
      setTypes(typesRes.data.results);
      setCategories(categoriesRes.data.results);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
        
        fetchData();
        
  }, [selectedTypeFilter, selectedCategoryFilter, searchQuery, dateFromFilter, dateToFilter, ordering]);

  const handleOpenModal = (item?: ProfessionalDevelopment) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        title: item.title,
        content: item.content,
        type: item.type,
        category: item.category,
        date_from: item.date_from.slice(0, 16), // Format for datetime-local
        date_to: item.date_to.slice(0, 16),
        price: item.price,
        can_register: item.can_register,
        status: item.status,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        title: "",
        content: "",
        type: undefined,
        category: undefined,
        date_from: "",
        date_to: "",
        price: 0,
        can_register: true,
        status: "active",
      });
    }
    setImageFile(null);
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof ProfessionalDevelopment];

        if (value !== undefined && value !== null) {
          data.append(key, value.toString());
        }
      });
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (selectedItem) {
        await professionalDevelopmentApi.update(selectedItem.id, data);
      } else {
        await professionalDevelopmentApi.create(data);
      }
      onClose();
      fetchData();
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setActionLoading(true);
      await professionalDevelopmentApi.delete(selectedItem.id);
      onDeleteClose();
      fetchData();
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setActionLoading(false);
    }
  };

    return (
        <DefaultLayout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                            {t('professionalDevelopment.title')}
                        </h1>
                        <p className="text-default-500 text-sm">
                            {t('professionalDevelopment.subtitle', 'Manage and browse professional development programs')}
                        </p>
                    </div>
                    <Button 
                        color="primary" 
                        size="lg" 
                        radius="full" 
                        startContent={<FiPlus />} 
                        onPress={() => handleOpenModal()}
                        className="font-bold shadow-lg shadow-primary/20 h-12 px-6"
                    >
                        {t('professionalDevelopment.addItem')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="rounded-[24px] border-none shadow-sm bg-default-50/50 backdrop-blur-md">
                    <CardBody className="p-6">
                        <div className="flex flex-col gap-6">
                            {/* Search Row */}
                            <div className="w-full">
                                <Input
                                    isClearable
                                    className="w-full"
                                    placeholder={t('professionalDevelopment.searchPlaceholder', 'Search programs by title or content...')}
                                    startContent={<FiSearch className="text-default-300" />}
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                    variant="flat"
                                    radius="lg"
                                    classNames={{
                                        inputWrapper: "bg-white dark:bg-default-100 h-14",
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <Select
                                    label={t('professionalDevelopment.filterByType')}
                                    placeholder={t('professionalDevelopment.allTypes')}
                                    variant="flat"
                                    radius="lg"
                                    selectedKeys={selectedTypeFilter ? [selectedTypeFilter] : []}
                                    onChange={(e: any) => setSelectedTypeFilter(e.target.value)}
                                    classNames={{
                                        trigger: "bg-white dark:bg-default-100 h-14",
                                    }}
                                >
                                    {types.map((type) => (
                                        <SelectItem key={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    label={t('professionalDevelopment.filterByCategory')}
                                    placeholder={t('professionalDevelopment.allCategories')}
                                    variant="flat"
                                    radius="lg"
                                    selectedKeys={selectedCategoryFilter ? [selectedCategoryFilter] : []}
                                    onChange={(e: any) => setSelectedCategoryFilter(e.target.value)}
                                    classNames={{
                                        trigger: "bg-white dark:bg-default-100 h-14",
                                    }}
                                >
                                    {categories.map((category) => (
                                        <SelectItem key={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    type="date"
                                    label={t('professionalDevelopment.dateFromLabel', 'Date From')}
                                    placeholder=" "
                                    variant="flat"
                                    radius="lg"
                                    value={dateFromFilter}
                                    onChange={(e: any) => setDateFromFilter(e.target.value)}
                                    classNames={{
                                        inputWrapper: "bg-white dark:bg-default-100 h-14",
                                    }}
                                />
                                <Input
                                    type="date"
                                    label={t('professionalDevelopment.dateToLabel', 'Date To')}
                                    placeholder=" "
                                    variant="flat"
                                    radius="lg"
                                    value={dateToFilter}
                                    onChange={(e: any) => setDateToFilter(e.target.value)}
                                    classNames={{
                                        inputWrapper: "bg-white dark:bg-default-100 h-14",
                                    }}
                                />
                                <Select
                                    label={t("common.sortBy", "Sort By")}
                                    labelPlacement="outside"
                                    selectedKeys={[ordering]}
                                    size="sm"
                                    className="w-40"
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0] as string;
                                        if (key) setOrdering(key);
                                    }}
                                >
                                    <SelectItem key="name">{t("common.sortNameAsc", "Name (A-Z)")}</SelectItem>
                                    <SelectItem key="-name">{t("common.sortNameDesc", "Name (Z-A)")}</SelectItem>
                                    <SelectItem key="-created_at">{t("common.sortNewest", "Newest")}</SelectItem>
                                    <SelectItem key="created_at">{t("common.sortOldest", "Oldest")}</SelectItem>
                                </Select>
                            </div>
                            
                            <div className="flex justify-end">
                                <Button
                                    variant="light"
                                    radius="lg"
                                    startContent={<FiFilter />}
                                    onPress={() => {
                                        setSelectedTypeFilter('');
                                        setSelectedCategoryFilter('');
                                        setSearchQuery('');
                                        setDateFromFilter('');
                                        setDateToFilter('');
                                    }}
                                    className="font-medium text-danger h-12"
                                >
                                    {t('professionalDevelopment.clearFilters')}
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* List */}
                <div className="flex flex-col gap-6">
                    {loading ? (
                        <div className="flex justify-center p-20">
                            <Spinner size="lg" color="primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <Card className="p-12 text-center bg-default-50 border-none shadow-none rounded-[32px]">
                            <CardBody className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center text-default-400">
                                    <FiEye size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold">{t('professionalDevelopment.noItemsFound')}</p>
                                    <p className="text-default-400 text-sm max-w-md">
                                        {t('professionalDevelopment.noItemsHelp', 'Try adjusting your filters or search criteria to find what you are looking for.')}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    ) : (
                        items.map((item) => (
                            <Card 
                                key={item.id} 
                                className="group hover:shadow-xl transition-all duration-500 rounded-[32px] border-none bg-content1 overflow-hidden"
                            >
                                <CardBody className="p-0">
                                    <div className="flex flex-col lg:flex-row min-h-[220px]">
                                        {/* Image Section */}
                                        <div className="lg:w-1/4 relative overflow-hidden bg-default-100">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                                                    onClick={() => navigate(`/professional-development/${item.id}`)}
                                                    removeWrapper
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-default-300">
                                                    <FiAward size={48} />
                                                </div>
                                            )}
                                            {/* Category/Type Badges on Image (mobile only or visible always?) */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                                                    {item.type_details?.name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between gap-6">
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                    <div className="space-y-2">
                                                        <h3
                                                            className="text-2xl font-black text-foreground hover:text-primary transition-colors cursor-pointer tracking-tight"
                                                            onClick={() => navigate(`/professional-development/${item.id}`)}
                                                        >
                                                            {item.title}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-default-500 font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <FiCalendar className="text-primary" />
                                                                <span>{formatDate(item.date_from)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <FiTag className="text-primary" />
                                                                <span>{item.category_details?.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <FiDollarSign className="text-success" />
                                                                <span className="font-bold text-success">
                                                                    {item.price === 0 ? t('common.free', 'Free') : formatCurrency(item.price, i18n.language)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            isIconOnly 
                                                            variant="flat" 
                                                            radius="full"
                                                            onPress={() => handleOpenModal(item)}
                                                            className="bg-default-100 hover:bg-primary/20 hover:text-primary transition-all"
                                                        >
                                                            <FiEdit size={18} />
                                                        </Button>
                                                        <Button
                                                            isIconOnly
                                                            variant="flat"
                                                            color="danger"
                                                            radius="full"
                                                            onPress={() => {
                                                                setSelectedItem(item);
                                                                onDeleteOpen();
                                                            }}
                                                            className="bg-danger-50 hover:bg-danger/20 transition-all text-danger"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-default-600 line-clamp-2 text-base leading-relaxed max-w-3xl font-medium opacity-80">
                                                    {item.content}
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-divider/50 gap-4">
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${item.status === 'active' ? 'bg-success' : 'bg-default-400'} animate-pulse`} />
                                                    <span className="text-sm font-bold text-default-600 uppercase tracking-widest">
                                                        {item.status === 'active' ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                                                    </span>
                                                </div>
                                                <Button 
                                                    color="primary" 
                                                    variant="shadow"
                                                    radius="full"
                                                    size="lg"
                                                    endContent={<FiArrowRight />}
                                                    onPress={() => navigate(`/professional-development/${item.id}`)}
                                                    className="font-bold w-full sm:w-auto px-10 shadow-lg shadow-primary/30"
                                                >
                                                    {t('common.viewDetails', 'View Program')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isOpen}
          scrollBehavior="inside"
          size="2xl"
          onClose={onClose}
        >
          <ModalContent>
            <ModalHeader>
              {selectedItem
                ? t("professionalDevelopment.editItem")
                : t("professionalDevelopment.addItem")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                isRequired
                label={t("professionalDevelopment.titleLabel")}
                value={formData.title}
                onValueChange={(value) =>
                  setFormData({ ...formData, title: value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  isRequired
                  label={t("professionalDevelopment.types")}
                  selectedKeys={formData.type ? [formData.type.toString()] : []}
                  onChange={(e) =>
                    setFormData({ ...formData, type: Number(e.target.value) })
                  }
                >
                  {types.map((type) => (
                    <SelectItem key={type.id}>{type.name}</SelectItem>
                  ))}
                </Select>
                <Select
                  isRequired
                  label={t("professionalDevelopment.categories")}
                  selectedKeys={
                    formData.category ? [formData.category.toString()] : []
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: Number(e.target.value),
                    })
                  }
                >
                  {categories.map((category) => (
                    <SelectItem key={category.id}>{category.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <Textarea
                isRequired
                label={t("professionalDevelopment.content")}
                minRows={3}
                value={formData.content}
                onValueChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label={t("professionalDevelopment.dateFrom")}
                  type="datetime-local"
                  value={formData.date_from}
                  onValueChange={(value) =>
                    setFormData({ ...formData, date_from: value })
                  }
                />
                <Input
                  isRequired
                  label={t("professionalDevelopment.dateTo")}
                  type="datetime-local"
                  value={formData.date_to}
                  onValueChange={(value) =>
                    setFormData({ ...formData, date_to: value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <Input
                  label={t("professionalDevelopment.price")}
                  startContent={t("common.currency", "LYD")}
                  type="number"
                  value={formData.price?.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, price: Number(value) })
                  }
                />
                <div className="flex flex-col gap-2">
                  <Switch
                    isSelected={formData.status === "active"}
                    onValueChange={(isSelected) =>
                      setFormData({
                        ...formData,
                        status: isSelected ? "active" : "inactive",
                      })
                    }
                  >
                    {t("professionalDevelopment.activeStatus")}
                  </Switch>
                  <Switch
                    isSelected={formData.can_register}
                    onValueChange={(isSelected) =>
                      setFormData({ ...formData, can_register: isSelected })
                    }
                  >
                    {t("professionalDevelopment.registrationOpen")}
                  </Switch>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("professionalDevelopment.image")}
                </label>
                <input
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
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
            <ModalHeader>{t("professionalDevelopment.deleteItem")}</ModalHeader>
            <ModalBody>
              {t("professionalDevelopment.confirmDeleteItem", {
                title: selectedItem?.title,
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
