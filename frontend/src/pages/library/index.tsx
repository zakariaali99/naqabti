import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Input,
  Button,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiMoreVertical,
  FiPlus,
  FiFileText,
  FiVideo,
  FiLink,
  FiImage,
  FiGrid,
  FiList,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiX,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { libraryApi, LibraryItem, LibraryItemType } from "@/api/libraryApi";
import { useUserStore } from "@/stores/userStore";
import doctorsMembershipApi from "@/api/doctorsMembershipApi";
import { formatDate } from "@/misc/formatDate";
import { Pagination } from "@/components/Pagination";

interface SpecialtyOption {
  id: number;
  name: string;
}

type ViewMode = "cards" | "list";

export default function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<any>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("-created_at");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [authorFilter, setAuthorFilter] = useState<string>("");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("libraryViewMode") as ViewMode) || "cards"
  );
  const [isPendingMembership, setIsPendingMembership] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await fetch("/api/doctor-specialties/");
        const data = await res.json();
        setSpecialties(Array.isArray(data) ? data : []);
      } catch {
        setSpecialties([]);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (!user?.is_staff) return;
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches/");
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : data?.results || []);
      } catch {
        setBranches([]);
      }
    };
    fetchBranches();
  }, [user?.is_staff]);

  useEffect(() => {
    if (user?.user_type !== "doctor") return;
    doctorsMembershipApi.getAll().then((res) => {
      const memberships = res.data?.results || [];
      if (memberships.length > 0 && memberships[0].status === "pending") {
        setIsPendingMembership(true);
      }
    }).catch(() => {});
  }, [user]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
    setSpecialtyFilter("");
    setSortOrder("-created_at");
    setBranchFilter("");
    setAuthorFilter("");
    setYearFrom("");
    setYearTo("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasAdvancedFilters = !!(specialtyFilter || authorFilter || yearFrom || yearTo || dateFrom || dateTo || branchFilter || sortOrder !== "-created_at");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery,
        page: currentPage,
      };
      if (activeTab !== "all") {
        params.item_type = activeTab;
      }
      if (specialtyFilter) {
        params.specialty = specialtyFilter;
      }
      if (authorFilter) {
        params.author_name = authorFilter;
      }
      if (yearFrom) {
        params.publication_year__gte = yearFrom;
      }
      if (yearTo) {
        params.publication_year__lte = yearTo;
      }
      if (dateFrom) {
        params.created_at__gte = dateFrom;
      }
      if (dateTo) {
        params.created_at__lte = dateTo;
      }
      if (branchFilter) {
        params.branch = branchFilter;
      }
      params.ordering = sortOrder;

      const response = await libraryApi.getAll(params);
      setItems(response.data.results);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error("Failed to fetch library items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, searchQuery, specialtyFilter, sortOrder, branchFilter, authorFilter, yearFrom, yearTo, dateFrom, dateTo, currentPage]);

  const handleDownload = async (item: LibraryItem) => {
    try {
      await libraryApi.incrementDownload(item.id);
      if (item.file_url) {
        window.open(item.file_url, "_blank");
      } else if (item.external_link) {
        window.open(item.external_link, "_blank");
      }
    } catch (error) {
      console.error("Failed to track download:", error);
    }
  };

  const getItemIcon = (type: LibraryItemType) => {
    switch (type) {
      case "pdf":
        return <FiFileText className="text-danger" />;
      case "video":
        return <FiVideo className="text-primary" />;
      case "link":
        return <FiLink className="text-secondary" />;
      case "image":
        return <FiImage className="text-success" />;
      default:
        return <FiFileText />;
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("libraryViewMode", mode);
  };

  return (
    <DefaultLayout>
      <div className="min-h-screen space-y-8 p-4 lg:p-8">
        {isPendingMembership && !noticeDismissed && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <p className="text-sm text-primary-700">{t("member.pendingServiceNotice")}</p>
            <button className="text-primary-500 hover:text-primary-700 shrink-0" onClick={() => setNoticeDismissed(true)}>
              <FiX size={16} />
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("library.title", "Electronic Library")}</h1>
            <p className="text-default-500 mt-1">
              {t("library.subtitle", "Browse through books, documents and resources.")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              variant={viewMode === "cards" ? "flat" : "light"}
              color={viewMode === "cards" ? "primary" : "default"}
              onPress={() => handleViewModeChange("cards")}
            >
              <FiGrid size={18} />
            </Button>
            <Button
              isIconOnly
              variant={viewMode === "list" ? "flat" : "light"}
              color={viewMode === "list" ? "primary" : "default"}
              onPress={() => handleViewModeChange("list")}
            >
              <FiList size={18} />
            </Button>
            {user && (
              <Button
                color="primary"
                variant="shadow"
                startContent={<FiPlus />}
                onPress={() => navigate("/library/add")}
                className="rounded-2xl font-medium"
              >
                {t("library.add", "Add Resource")}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Tabs
              aria-label="Library filters"
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
            >
              <Tab key="all" title={t("library.types.all", "All")} />
              <Tab key="pdf" title={t("library.types.pdf", "PDF")} />
              <Tab key="video" title={t("library.types.video", "Video")} />
              <Tab key="link" title={t("library.types.link", "Links")} />
            </Tabs>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input
                isClearable
                className="w-full md:max-w-xs"
                placeholder={t("library.searchPlaceholder", "Search library...")}
                startContent={<FiSearch />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                classNames={{
                  inputWrapper: "rounded-2xl h-12 bg-default-100",
                }}
              />
              <Button
                isIconOnly
                variant="light"
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
              </Button>
            </div>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-appearance-in">
              <Select
                label={t("library.allSpecialties", "All Specialties")}
                selectedKeys={[specialtyFilter || "all"]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setSpecialtyFilter(val === "all" ? "" : val);
                }}
              >
                <SelectItem key="all">{t("library.allSpecialties", "All Specialties")}</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={String(s.id)}>{s.name}</SelectItem>
                )) as any}
              </Select>

              {user?.is_staff && (
                <Select
                  label={t("library.branchFilter", "Branch")}
                  selectedKeys={[branchFilter || "all"]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    setBranchFilter(val === "all" ? "" : val);
                  }}
                >
                  <SelectItem key="all">{t("library.allBranches", "All Branches")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={String(b.id)}>{b.name}</SelectItem>
                  )) as any}
                </Select>
              )}

              <Input
                label={t("library.authorLabel", "Author")}
                value={authorFilter}
                onValueChange={setAuthorFilter}
                classNames={{ inputWrapper: "rounded-2xl" }}
              />

              <Input
                type="number"
                label={t("library.yearFromLabel", "Year From")}
                value={yearFrom}
                onValueChange={setYearFrom}
                classNames={{ inputWrapper: "rounded-2xl" }}
              />

              <Input
                type="number"
                label={t("library.yearToLabel", "Year To")}
                value={yearTo}
                onValueChange={setYearTo}
                classNames={{ inputWrapper: "rounded-2xl" }}
              />

              <Input
                type="date"
                label={t("library.dateFromLabel", "Date From")}
                value={dateFrom}
                onValueChange={setDateFrom}
                classNames={{ inputWrapper: "rounded-2xl" }}
              />

              <Input
                type="date"
                label={t("library.dateToLabel", "Date To")}
                value={dateTo}
                onValueChange={setDateTo}
                classNames={{ inputWrapper: "rounded-2xl" }}
              />

              <Select
                label={t("library.sortLabel", "Sort By")}
                selectedKeys={[sortOrder]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  if (val) setSortOrder(val);
                }}
              >
                <SelectItem key="-created_at">{t("library.sortNewest", "Newest First")}</SelectItem>
                <SelectItem key="created_at">{t("library.sortOldest", "Oldest First")}</SelectItem>
                <SelectItem key="title">{t("library.sortTitleAsc", "Title A-Z")}</SelectItem>
                <SelectItem key="-title">{t("library.sortTitleDesc", "Title Z-A")}</SelectItem>
                <SelectItem key="-download_count">{t("library.sortDownloads", "Most Downloaded")}</SelectItem>
                <SelectItem key="-view_count">{t("library.sortViews", "Most Viewed")}</SelectItem>
              </Select>

              {hasAdvancedFilters && (
                <div className="flex items-end">
                  <Button variant="flat" color="danger" onPress={clearFilters}>
                    {t("library.clearFilters", "Clear Filters")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-default-500 italic">{t("library.noResults", "No library items found matches your search criteria.")}</p>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] bg-content1 hover:bg-content2 transition-all duration-300 border border-divider overflow-hidden relative"
              >
                {/* Thumbnail area */}
                <div className="h-40 bg-default-100 flex items-center justify-center relative overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl opacity-20">
                      {getItemIcon(item.item_type)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Chip size="sm" color="default" variant="flat" className="backdrop-blur-sm bg-white/30">
                      {item.item_type_display}
                    </Chip>
                  </div>
                </div>

                {/* Content area */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                  {item.created_by_name && (
                    <p className="text-xs text-default-400 flex items-center gap-1">
                      <FiUser size={12} />
                      {item.created_by_name}
                    </p>
                  )}
                  {item.specialty_name && (
                    <Chip size="sm" variant="flat" color="secondary">
                      {item.specialty_name}
                    </Chip>
                  )}
                  <p className="text-default-500 text-sm line-clamp-2 min-h-[40px]">
                    {item.description || t("library.noDescription", "No description provided.")}
                  </p>

                  <div className="flex items-center justify-between text-xs text-default-400 pt-2 border-t border-divider">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FiEye className="inline" /> {item.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiDownload className="inline" /> {item.download_count}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleDownload(item)}
                    >
                      {item.item_type === 'link' ? t("library.open", "Open") : t("library.download", "Download")}
                    </Button>
                  </div>
                </div>

                {user && (
                  <div className="absolute top-2 left-2 z-10">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="flat" className="bg-white/50 backdrop-blur-sm">
                          <FiMoreVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Admin actions">
                        <DropdownItem key="edit" onPress={() => navigate(`/library/${item.id}/edit`)}>
                          {t("library.actions.edit", "Edit Resource")}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          onPress={async () => {
                            if (window.confirm(t("library.deleteConfirm", "Delete this resource?"))) {
                              await libraryApi.delete(item.id);
                              fetchItems();
                            }
                          }}
                        >
                          {t("library.actions.delete", "Delete Resource")}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] bg-content1 hover:bg-content2 transition-all duration-300 border border-divider p-4 flex items-center gap-4"
              >
                <div className="text-2xl opacity-30 shrink-0">
                  {getItemIcon(item.item_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-default-400 truncate">
                    {item.author_name && `${item.author_name}`}
                    {item.author_name && item.specialty_name && " · "}
                    {item.specialty_name}
                    {item.created_by_name && ` · ${item.created_by_name}`}
                    {` · ${formatDate(item.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-default-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <FiEye size={14} /> {item.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiDownload size={14} /> {item.download_count}
                  </span>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => handleDownload(item)}
                  >
                    {item.item_type === 'link' ? t("library.open", "Open") : t("library.download", "Download")}
                  </Button>
                  {user && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <FiMoreVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Actions">
                        <DropdownItem key="edit" onPress={() => navigate(`/library/${item.id}/edit`)}>
                          {t("library.actions.edit", "Edit")}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          onPress={async () => {
                            if (window.confirm(t("library.deleteConfirm", "Delete this resource?"))) {
                              await libraryApi.delete(item.id);
                              fetchItems();
                            }
                          }}
                        >
                          {t("library.actions.delete", "Delete")}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={loading}
        />
      </div>
    </DefaultLayout>
  );
}
