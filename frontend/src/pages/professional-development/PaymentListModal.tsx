import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell,
    Chip,
    Button,
    Tooltip
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ProfessionalDevelopmentRegistration } from '@/models/professionalDevelopment';
import { formatDate, formatTime } from '@/misc/formatDate';
import { formatCurrency } from '@/misc/formatCurrency';
import { FiClock, FiCreditCard, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { paymentsApi } from '@/api/paymentsApi';
import { Payment } from '@/models/payments';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import AddPaymentModal from './AddPaymentModal';

interface PaymentListModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: ProfessionalDevelopmentRegistration | null;
    onRefresh: () => void;
}

export default function PaymentListModal({ isOpen, onClose, registration, onRefresh }: PaymentListModalProps) {
    const { t, i18n } = useTranslation();
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!selectedPayment) return;
        try {
            setLoading(true);
            await paymentsApi.delete(selectedPayment.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedPayment(null);
        } catch (error) {
            console.error('Failed to delete payment:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!registration) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="3xl"
            scrollBehavior="inside"
            backdrop="blur"
        >
            <ModalContent>
                <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex justify-between items-center w-full pr-6">
                                <div>
                                    <h3 className="text-xl font-bold">{t('professionalDevelopment.paymentList', 'Payment List')}</h3>
                                    <p className="text-sm font-normal text-default-400">
                                        {registration.doctor_details?.full_name}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        <ModalBody className="pb-8">
                            <div className="bg-default-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-default-500 uppercase font-bold tracking-wider">{t('professionalDevelopment.totalPaid', 'Total Paid')}</p>
                                    <p className="text-2xl font-black text-primary">{formatCurrency(registration.paid_amount || 0, i18n.language)}</p>
                                </div>
                                <Chip 
                                    color={registration.payment_status === 'paid' ? 'success' : 'warning'} 
                                    variant="flat"
                                    className="font-bold"
                                >
                                    {t(`professionalDevelopment.payment${registration.payment_status.charAt(0).toUpperCase() + registration.payment_status.slice(1)}`)}
                                </Chip>
                            </div>

                            <Table 
                                aria-label="Payments table"
                                removeWrapper
                                className="min-w-full"
                            >
                                <TableHeader>
                                    <TableColumn className="bg-default-50 py-3">{t('payments.amount', 'Amount')}</TableColumn>
                                    <TableColumn className="bg-default-50 py-3">{t('payments.method', 'Method')}</TableColumn>
                                    <TableColumn className="bg-default-50 py-3">{t('payments.date', 'Date')}</TableColumn>
                                    <TableColumn className="bg-default-50 py-3">{t('payments.reference', 'Reference')}</TableColumn>
                                    <TableColumn className="bg-default-50 py-3 text-center">{t('common.actions', 'Actions')}</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent={t('payments.noPaymentsFound', 'No payments found')}>
                                    {(registration.payment_records || []).map((payment) => (
                                        <TableRow key={payment.id} className="border-b border-divider/50">
                                            <TableCell className="py-3 font-bold">
                                                {formatCurrency(Number(payment.amount), i18n.language)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <FiCreditCard size={14} className="text-default-400" />
                                                    <span className="capitalize">{t(`payments.methods.${payment.payment_method}`, payment.payment_method)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-default-600 font-medium">
                                                        <span>{formatDate(payment.payment_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-default-400 text-xs mt-0.5 ml-0.5 italic">
                                                        <FiClock size={12} />
                                                        <span>{formatTime(payment.payment_date)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-default-400 text-sm italic">
                                                {payment.reference_number || '-'}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Tooltip content={t('common.edit')}>
                                                        <Button 
                                                            isIconOnly 
                                                            size="sm" 
                                                            variant="light" 
                                                            onPress={() => {
                                                                setSelectedPayment(payment);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            <FiEdit2 size={16} className="text-primary" />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content={t('common.delete')} color="danger">
                                                        <Button 
                                                            isIconOnly 
                                                            size="sm" 
                                                            variant="light" 
                                                            onPress={() => {
                                                                setSelectedPayment(payment);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                        >
                                                            <FiTrash2 size={16} className="text-danger" />
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ModalBody>
                </>
            </ModalContent>

            <AddPaymentModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPayment(null);
                }}
                onSuccess={onRefresh}
                registration={registration}
                payment={selectedPayment}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedPayment(null);
                }}
                onConfirm={handleDelete}
                title={t('payments.delete', 'Delete Payment')}
                message={t('payments.deleteConfirm', 'Are you sure you want to delete this payment record? This action cannot be undone.')}
                isLoading={loading}
            />
        </Modal>
    );
}
