import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  FiDownload,
  FiEye,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiX,
} from "react-icons/fi";

import { Pagination } from "@/components/Pagination";
import { useUserStore } from "@/stores/userStore";
import certificationsApi from "@/api/certificationsApi";
import doctorsMembershipApi from "@/api/doctorsMembershipApi";

interface MemberCertification {
  id: number;
  title: string;
  type: string;
  status: "active" | "expired" | "pending" | "suspended";
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
  document?: string;
}

export default function MemberCertificationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useUserStore();
  const [certifications, setCertifications] = useState<MemberCertification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [isPendingMembership, setIsPendingMembership] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(
      i18n.language === "ar" ? "ar-LY" : "en-US",
    );
  };

  useEffect(() => {
    if (!user) return;

    const fetchCertifications = async () => {
      try {
        setLoading(true);
        const response = await certificationsApi.getAll({ page_size: 100 });
        const mapped: MemberCertification[] = (response.data?.results || []).map(
          (cert: any) => {
            const title =
              typeof cert.certification_type === "object" && cert.certification_type
                ? cert.certification_type.name
                : cert.issued_from || "Certification";

            const type =
              typeof cert.certification_type === "object" && cert.certification_type
                ? cert.certification_type.category || cert.certification_type.name
                : "-";

            let status: "active" | "expired" | "pending" | "suspended" = "active";
            if (cert.expiry_date) {
              const expiryDateObj = new Date(cert.expiry_date);
              if (!isNaN(expiryDateObj.getTime()) && expiryDateObj < new Date()) {
                status = "expired";
              }
            }

            return {
              id: cert.id,
              title,
              type,
              status,
              issueDate: cert.issue_date || "",
              expiryDate: cert.expiry_date || "",
              certificateNumber: `#${cert.id}`,
              document: cert.document || undefined,
            };
          }
        );
        setCertifications(mapped);
      } catch (error) {
        console.error("Failed to fetch member certifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [user]);

  useEffect(() => {
    if (user?.user_type !== "doctor") return;
    doctorsMembershipApi.getAll().then((res) => {
      const memberships = res.data?.results || [];
      if (memberships.length > 0 && memberships[0].status === "pending") {
        setIsPendingMembership(true);
      }
    }).catch(() => {});
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "expired":
        return "danger";
      case "suspended":
        return "default";
      default:
        return "default";
    }
  };

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCertifications.length / itemsPerPage);
  const paginatedCertifications = filteredCertifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleDownload = (certification: MemberCertification) => {
    if (certification.document) {
      window.open(certification.document, "_blank");
    } else {
      console.warn("No document URL available for download");
    }
  };

  const handleView = (certification: MemberCertification) => {
    if (certification.document) {
      window.open(certification.document, "_blank");
    } else {
      console.warn("No document URL available to view");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
        {isPendingMembership && !noticeDismissed && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3 flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-primary-700">{t("member.pendingServiceNotice")}</p>
            <button className="text-primary-500 hover:text-primary-700 shrink-0" onClick={() => setNoticeDismissed(true)}>
              <FiX size={16} />
            </button>
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t("member.myCertifications")}
          </h1>
          <p className="text-default-600">
            {t("member.certificationsDescription")}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                className="flex-1"
                placeholder={t("member.searchCertifications")}
                startContent={<FiSearch />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                className="w-full sm:w-48"
                placeholder={t("member.filterByStatus")}
                startContent={<FiFilter />}
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              >
                <SelectItem key="">{t("common.all")}</SelectItem>
                <SelectItem key="active">
                  {t("member.status.active")}
                </SelectItem>
                <SelectItem key="pending">
                  {t("member.status.pending")}
                </SelectItem>
                <SelectItem key="expired">
                  {t("member.status.expired")}
                </SelectItem>
                <SelectItem key="suspended">
                  {t("member.status.suspended")}
                </SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Certifications Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {t("member.certificationsList")}
              </h3>
              <Chip color="primary" variant="flat">
                {filteredCertifications.length}{" "}
                {t("member.totalCertifications")}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <Table aria-label="Member certifications table">
              <TableHeader>
                <TableColumn>{t("member.certificateTitle")}</TableColumn>
                <TableColumn>{t("member.certificateType")}</TableColumn>
                <TableColumn>{t("member.certificateNumber")}</TableColumn>
                <TableColumn>{t("member.status")}</TableColumn>
                <TableColumn>{t("member.issueDate")}</TableColumn>
                <TableColumn>{t("member.expiryDate")}</TableColumn>
                <TableColumn>{t("common.actions")}</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                items={paginatedCertifications}
                loadingContent={t("common.loading")}
              >
                {(certification: MemberCertification) => (
                  <TableRow key={certification.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{certification.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{certification.type}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {certification.certificateNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getStatusColor(certification.status) as any}
                        size="sm"
                        variant="flat"
                      >
                        {t(`member.status.${certification.status}`)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        {formatDate(certification.issueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        {formatDate(certification.expiryDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {certification.document && (
                          <Button
                            size="sm"
                            startContent={<FiEye size={14} />}
                            variant="light"
                            onPress={() => handleView(certification)}
                          >
                            {t("common.view")}
                          </Button>
                        )}
                        {certification.document && certification.status === "active" && (
                          <Button
                            color="primary"
                            size="sm"
                            startContent={<FiDownload size={14} />}
                            variant="light"
                            onPress={() => handleDownload(certification)}
                          >
                            {t("common.download")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardBody>
        </Card>
    </div>
  );
}
