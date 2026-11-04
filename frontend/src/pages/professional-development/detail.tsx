import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Card,
    CardBody,
    Button,
    Image,
    Spinner,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from '@heroui/react';
import { 
    FiArrowLeft, 
    FiCalendar, 
    FiPlus, 
    FiTag, 
    FiType, 
    FiDollarSign, 
    FiUsers,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiExternalLink,
    FiAward,
    FiMoreHorizontal,
    FiEdit2,
    FiTrash2,
    FiSend,
    FiCreditCard,
    FiFileText,
} from 'react-icons/fi';
import DefaultLayout from '@/layouts/default';
import professionalDevelopmentApi from '@/api/professionalDevelopmentApi';
import { ProfessionalDevelopment, ProfessionalDevelopmentRegistration } from '@/models/professionalDevelopment';
import { formatDate } from '@/misc/formatDate';
import { formatCurrency } from '@/misc/formatCurrency';
import RegistrationModal from './RegistrationModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import PaymentListModal from './PaymentListModal';
import AddPaymentModal from './AddPaymentModal';

export default function ProfessionalDevelopmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState<ProfessionalDevelopment | null>(null);
  const [registrations, setRegistrations] = useState<
    ProfessionalDevelopmentRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<ProfessionalDevelopmentRegistration | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentListOpen, setIsPaymentListOpen] = useState(false);
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await professionalDevelopmentApi.getById(Number(id));

      setItem(response.data);
    } catch (error) {
      console.error("Failed to fetch item:", error);
    } finally {
      setLoading(false);
    }
  };

    const fetchRegistrations = async () => {
        if (!id) return;
        try {
            setRegistrationsLoading(true);
            const response = await professionalDevelopmentApi.getPDRegistrations(Number(id), { page });
            const results = response.data.results;
            setRegistrations(results);
            setTotalPages(Math.ceil(response.data.count / 10)); // Assuming page size 10
            
            // Update selectedRegistration to reflect changes (especially payments)
            if (selectedRegistration) {
                const refreshed = results.find((r: any) => r.id === selectedRegistration.id);
                if (refreshed) {
                    setSelectedRegistration(refreshed);
                }
            }
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
        } finally {
            setRegistrationsLoading(false);
        }
    };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    fetchRegistrations();
  }, [id, page]);

    const handleSendNotification = async (regId: number) => {
        try {
            setActionLoading(true);
            await professionalDevelopmentApi.sendPDRegistrationNotification(regId);
            // Optionally show a toast here if available
        } catch (error) {
            console.error('Failed to send notification:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = async () => {
        if (!id) return;
        try {
            setActionLoading(true);
            const response = await professionalDevelopmentApi.exportPDRegistrations(Number(id));
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `registrations_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRegistration = async () => {
        if (!selectedRegistration) return;
        try {
            setActionLoading(true);
            await professionalDevelopmentApi.deletePDRegistration(selectedRegistration.id);
            fetchRegistrations();
            setIsDeleteModalOpen(false);
            setSelectedRegistration(null);
        } catch (error) {
            console.error('Failed to delete registration:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (regId: number, status: 'confirmed' | 'cancelled') => {
        try {
            setActionLoading(true);
            await professionalDevelopmentApi.updatePDRegistration(regId, { status });
            fetchRegistrations();
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setActionLoading(false);
        }
    };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!item) {
    return (
      <DefaultLayout>
        <div className="text-center p-8">
          {t("professionalDevelopment.itemNotFound", "Item not found")}
        </div>
      </DefaultLayout>
    );
  }

    return (
        <DefaultLayout>
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Button 
                        variant="flat" 
                        onPress={() => navigate(-1)}
                        className="bg-content1 hover:bg-content2 px-4 h-11"
                        startContent={<FiArrowLeft className="rtl:rotate-180" />}
                    >
                        {t('common.back')}
                    </Button>
                </div>

                {/* Main Header & Title */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                                <FiAward className="text-2xl" />
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                {item.title}
                            </h1>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 opacity-90">
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                className="bg-primary/5 text-primary border-primary/20"
                                startContent={<FiType size={14} className="mx-1" />}
                            >
                                {item.type_details?.name}
                            </Chip>
                            <Chip 
                                size="sm" 
                                variant="flat"
                                className="bg-secondary/5 text-secondary border-secondary/20"
                                startContent={<FiTag size={14} className="mx-1" />}
                            >
                                {item.category_details?.name}
                            </Chip>
                            <Chip 
                                size="sm" 
                                color={item.status === 'active' ? 'success' : 'default'}
                                variant="dot"
                                className="font-semibold"
                            >
                                {item.status === 'active' ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </Chip>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <div className={`text-4xl font-black ${item.price === 0 ? 'text-green-500' : 'text-primary'}`}>
                            {item.price === 0 ? t('common.free', 'Free') : formatCurrency(item.price, i18n.language)}
                        </div>
                        <p className="text-default-400 text-sm font-medium">{t('professionalDevelopment.pricePerSeat')}</p>
                    </div>
                </div>

                {/* Quick Info Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-content1 border border-default-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <FiCalendar />
                        </div>
                        <div>
                            <p className="text-default-400 text-xs font-bold uppercase tracking-wider">{t('professionalDevelopment.startDate')}</p>
                            <p className="text-foreground font-bold">{formatDate(item.date_from)}</p>
                        </div>
                    </div>

                    <div className="bg-content1 border border-default-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <FiCalendar />
                        </div>
                        <div>
                            <p className="text-default-400 text-xs font-bold uppercase tracking-wider">{t('professionalDevelopment.endDate')}</p>
                            <p className="text-foreground font-bold">{formatDate(item.date_to)}</p>
                        </div>
                    </div>

                    <div className="bg-content1 border border-default-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <FiUsers />
                        </div>
                        <div>
                            <p className="text-default-400 text-xs font-bold uppercase tracking-wider">{t('professionalDevelopment.totalRegistrations')}</p>
                            <p className="text-foreground font-bold">{registrations.length}</p>
                        </div>
                    </div>

                    <div className="bg-content1 border border-default-100 p-5 rounded-[24px] shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="text-default-400 text-xs font-bold uppercase tracking-wider">{t('professionalDevelopment.revenue')}</p>
                            <p className="text-foreground font-bold">{formatCurrency(registrations.filter(r => r.payment_status === 'paid').length * item.price, i18n.language)}</p>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Description & Media */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-[32px] overflow-hidden border-none shadow-md">
                            <CardBody className="p-0">
                                {item.image ? (
                                    <div className="relative group">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-video bg-default-100 flex items-center justify-center text-default-300">
                                        <FiAward size={80} />
                                    </div>
                                )}
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                                        <h3 className="text-xl font-bold">{t('professionalDevelopment.programOverview')}</h3>
                                    </div>
                                    <div className="prose prose-sm md:prose-base max-w-none text-default-600 leading-relaxed whitespace-pre-wrap">
                                        {item.content}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Right Column: Actions & Details Card */}
                    <div className="space-y-6">
                        <Card className="rounded-[32px] border-none shadow-md bg-content1 overflow-hidden">
                            <CardBody className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FiPlus className="text-primary" /> 
                                        {t('professionalDevelopment.management')}
                                    </h3>
                                    <Button 
                                        color="primary" 
                                        fullWidth 
                                        size="lg"
                                        radius="full"
                                        startContent={<FiPlus />} 
                                        onPress={() => setIsAddModalOpen(true)}
                                        className="font-bold text-white shadow-lg shadow-primary/20 h-14"
                                    >
                                        {t('professionalDevelopment.addRegistration')}
                                    </Button>
                                    <Button 
                                        variant="bordered"
                                        fullWidth 
                                        size="lg"
                                        radius="full"
                                        startContent={<FiFileText />} 
                                        onPress={handleExport}
                                        isLoading={actionLoading}
                                        className="font-bold border-2 h-14"
                                    >
                                        {t('common.exportToExcel', 'Export to Excel')}
                                    </Button>
                                </div>

                                <div className="pt-4 border-t border-divider space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-default-500">{t('professionalDevelopment.status', 'Status')}</span>
                                        <Chip size="sm" color={item.status === 'active' ? 'success' : 'default'} variant="flat">
                                            {item.status === 'active' ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                                        </Chip>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-default-500">{t('professionalDevelopment.registrationOpen')}</span>
                                        <Chip size="sm" color={item.can_register ? 'success' : 'danger'} variant="flat">
                                            {item.can_register ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                        </Chip>
                                    </div>
                                </div>

                                <div className="bg-default-50 p-4 rounded-2xl flex items-start gap-3">
                                    <FiExternalLink className="text-primary mt-1 shrink-0" />
                                    <div className="text-xs text-default-600 leading-normal">
                                        {t('professionalDevelopment.enrollmentNotice')}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Registrations List Section */}
                <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-end px-2">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">{t('professionalDevelopment.registrations')}</h2>
                            <p className="text-default-400 text-sm">{t('professionalDevelopment.registrationsSub')}</p>
                        </div>
                    </div>

                    <Card className="rounded-[32px] border-none shadow-md overflow-hidden bg-content1">
                        <CardBody className="p-0">
                            {registrationsLoading ? (
                                <div className="flex justify-center p-20">
                                    <Spinner size="lg" color="primary" label={t('common.loading')} />
                                </div>
                            ) : (
                                <>
                                    <Table 
                                        aria-label="Registrations table"
                                        removeWrapper
                                        className="min-w-full"
                                    >
                                        <TableHeader>
                                            <TableColumn className="bg-default-50 py-4 h-auto">{t('professionalDevelopment.doctor')}</TableColumn>
                                            <TableColumn className="bg-default-50 py-4 h-auto">{t('professionalDevelopment.registrationDate')}</TableColumn>
                                            <TableColumn className="bg-default-50 py-4 h-auto">{t('professionalDevelopment.status')}</TableColumn>
                                            <TableColumn className="bg-default-50 py-4 h-auto">{t('professionalDevelopment.paymentStatus')}</TableColumn>
                                            <TableColumn className="bg-default-50 py-4 h-auto">{t('professionalDevelopment.paidAmount', 'Total Paid')}</TableColumn>
                                            <TableColumn className="bg-default-50 py-4 h-auto ltr:rounded-te-3xl rtl:rounded-ts-3xl">{t('common.actions', 'Actions')}</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent={t('professionalDevelopment.noRegistrationsFound')}>
                                            {registrations.map((reg) => (
                                                <TableRow key={reg.id} className="border-b border-divider/50 hover:bg-default-50/50 transition-colors">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {reg.doctor_details?.full_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{reg.doctor_details?.full_name}</p>
                                                                <p className="text-xs text-default-400">{reg.doctor_details?.email || reg.doctor_details?.phone_number}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 text-default-600">
                                                            <FiClock size={14} />
                                                            <span>{formatDate(reg.registration_date)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Chip 
                                                            size="sm" 
                                                            color={reg.status === 'confirmed' ? 'success' : 'warning'} 
                                                            variant="flat"
                                                            className="font-medium"
                                                            startContent={reg.status === 'confirmed' ? <FiCheckCircle size={12} className="mx-1" /> : <FiClock size={12} className="mx-1" />}
                                                        >
                                                            {t(`professionalDevelopment.status${reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}`)}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Chip 
                                                            size="sm" 
                                                            color={reg.payment_status === 'paid' ? 'success' : 'warning'} 
                                                            variant="dot"
                                                            className="font-bold border-none"
                                                        >
                                                            {t(`professionalDevelopment.payment${reg.payment_status.charAt(0).toUpperCase() + reg.payment_status.slice(1)}`)}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-bold text-primary">
                                                        {formatCurrency(reg.paid_amount || 0, i18n.language)}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-center">
                                                        <Dropdown backdrop="blur">
                                                            <DropdownTrigger>
                                                                <Button isIconOnly variant="light" size="sm" radius="full">
                                                                    <FiMoreHorizontal />
                                                                </Button>
                                                            </DropdownTrigger>
                                                            <DropdownMenu aria-label="Registration Actions">
                                                                <DropdownItem 
                                                                    key="payments" 
                                                                    startContent={<FiCreditCard size={16} />}
                                                                    onPress={() => {
                                                                        setSelectedRegistration(reg);
                                                                        setIsPaymentListOpen(true);
                                                                    }}
                                                                >
                                                                    {t('professionalDevelopment.viewPayments', 'View Payments')}
                                                                </DropdownItem>
                                                                <DropdownItem 
                                                                    key="add-payment" 
                                                                    startContent={<FiPlus size={16} />}
                                                                    onPress={() => {
                                                                        setSelectedRegistration(reg);
                                                                        setIsAddPaymentOpen(true);
                                                                    }}
                                                                >
                                                                    {t('payments.add', 'Add Payment')}
                                                                </DropdownItem>
                                                                <DropdownItem 
                                                                    key="edit" 
                                                                    startContent={<FiEdit2 size={16} />}
                                                                    onPress={() => {
                                                                        setSelectedRegistration(reg);
                                                                        setIsAddModalOpen(true);
                                                                    }}
                                                                >
                                                                    {t('common.edit')}
                                                                </DropdownItem>
                                                                <DropdownItem 
                                                                    key="notification" 
                                                                    startContent={<FiSend size={16} />}
                                                                    onPress={() => handleSendNotification(reg.id)}
                                                                >
                                                                    {t('notifications.add', 'Send Notification')}
                                                                </DropdownItem>
                                                                <DropdownItem 
                                                                    key="accept" 
                                                                    className="text-success"
                                                                    color="success"
                                                                    isDisabled={reg.status === 'confirmed'}
                                                                    startContent={<FiCheckCircle size={16} />}
                                                                    onPress={() => handleStatusUpdate(reg.id, 'confirmed')}
                                                                >
                                                                    {t('professionalDevelopment.accept', 'Accept')}
                                                                </DropdownItem>
                                                                <DropdownItem 
                                                                    key="reject" 
                                                                    className="text-danger"
                                                                    color="danger"
                                                                    isDisabled={reg.status === 'cancelled'}
                                                                    startContent={<FiXCircle size={16} />}
                                                                    onPress={() => handleStatusUpdate(reg.id, 'cancelled')}
                                                                >
                                                                    {t('professionalDevelopment.reject', 'Reject')}
                                                                </DropdownItem>
                                                                <DropdownItem 
                                                                    key="delete" 
                                                                    className="text-danger" 
                                                                    color="danger"
                                                                    startContent={<FiTrash2 size={16} />}
                                                                    onPress={() => {
                                                                        setSelectedRegistration(reg);
                                                                        setIsDeleteModalOpen(true);
                                                                    }}
                                                                >
                                                                    {t('common.delete')}
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    
                                    <div className="p-6 flex justify-between items-center border-t border-divider/50">
                                        <p className="text-sm text-default-400">
                                            {t('common.showing', 'Showing')} {registrations.length} {t('common.results', 'results')}
                                        </p>
                                        {totalPages > 1 && (
                                            <Pagination
                                                total={totalPages}
                                                page={page}
                                                onChange={setPage}
                                                color="primary"
                                                variant="flat"
                                                size="sm"
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <RegistrationModal 
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setSelectedRegistration(null);
                    }}
                    onSuccess={fetchRegistrations}
                    pdId={parseInt(id!)}
                    registration={selectedRegistration}
                />

                <DeleteConfirmModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteRegistration}
                    isLoading={actionLoading}
                    itemName={selectedRegistration?.doctor_details?.full_name}
                />
            </div>

            <PaymentListModal 
                isOpen={isPaymentListOpen}
                onClose={() => {
                    setIsPaymentListOpen(false);
                    setSelectedRegistration(null);
                }}
                registration={selectedRegistration}
                onRefresh={fetchRegistrations}
            />

            <AddPaymentModal 
                isOpen={isAddPaymentOpen}
                onClose={() => {
                    setIsAddPaymentOpen(false);
                    setSelectedRegistration(null);
                }}
                onSuccess={fetchRegistrations}
                registration={selectedRegistration}
            />
        </DefaultLayout>
    );
}
