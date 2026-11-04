import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { ProfessionalDevelopmentRegistration } from '@/models/professionalDevelopment';
import professionalDevelopmentApi from '@/api/professionalDevelopmentApi';
import { paymentsApi } from '@/api/paymentsApi';
import { Payment } from '@/models/payments';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    registration: ProfessionalDevelopmentRegistration | null;
    payment?: Payment | null;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    registration,
    payment
}) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && registration) {
            if (payment) {
                setAmount(payment.amount);
                setPaymentMethod(payment.payment_method);
                setReferenceNumber(payment.reference_number || '');
                setDescription(payment.description || '');
            } else {
                setAmount('');
                setPaymentMethod('cash');
                setReferenceNumber(`PD-${registration.professional_development}-${registration.id}`);
                setDescription(`Payment for ${registration.professional_development_details?.title}`);
            }
        }
    }, [isOpen, registration, payment]);

    const remaining = (registration?.professional_development_details?.price || 0) - (registration?.paid_amount || 0) + (payment ? parseFloat(payment.amount) : 0);
    const isAmountInvalid = parseFloat(amount) > remaining;

    const handleSubmit = async () => {
        if (!registration || !amount) return;

        try {
            setLoading(true);
            if (payment) {
                await paymentsApi.update(payment.id, {
                    id: payment.id,
                    amount: amount,
                    payment_method: paymentMethod as any,
                    reference_number: referenceNumber,
                    description: description
                });
            } else {
                await professionalDevelopmentApi.addPDRegistrationPayment(registration.id, {
                    amount: parseFloat(amount),
                    payment_method: paymentMethod as any,
                    reference_number: referenceNumber,
                    description: description
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add payment:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!registration) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="md"
            backdrop="blur"
            className="rounded-[32px]"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 text-2xl font-black">
                    {payment ? t('payments.edit', 'Edit Payment') : t('payments.add', 'Add Payment')}
                    <p className="text-sm font-normal text-default-400">
                        {registration.doctor_details?.full_name}
                    </p>
                </ModalHeader>
                <ModalBody className="py-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-default-600 block px-1">
                                {t('payments.amount', 'Amount')}
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onValueChange={setAmount}
                                variant="bordered"
                                radius="lg"
                                isInvalid={isAmountInvalid}
                                errorMessage={isAmountInvalid ? `${t('payments.exceedsRemaining', 'Exceeds remaining balance')}: ${remaining} LYD` : ""}
                                description={`${t('payments.remaining', 'Remaining')}: ${remaining} LYD`}
                                classNames={{
                                    inputWrapper: "h-[52px] border-2",
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-default-600 block px-1">
                                {t('payments.method', 'Payment Method')}
                            </label>
                            <Select
                                placeholder={t('payments.selectMethod', 'Select method')}
                                selectedKeys={[paymentMethod]}
                                onChange={(e: any) => setPaymentMethod(e.target.value)}
                                variant="bordered"
                                radius="lg"
                                classNames={{
                                    trigger: "h-[52px] border-2",
                                }}
                            >
                                <SelectItem key="cash">{t('payments.methods.cash', 'Cash')}</SelectItem>
                                <SelectItem key="card">{t('payments.methods.card', 'Card')}</SelectItem>
                                <SelectItem key="bank_transfer">{t('payments.methods.bank_transfer', 'Bank Transfer')}</SelectItem>
                                <SelectItem key="online">{t('payments.methods.online', 'Online')}</SelectItem>
                                <SelectItem key="other">{t('payments.methods.other', 'Other')}</SelectItem>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-default-600 block px-1">
                                {t('payments.reference', 'Reference Number')}
                            </label>
                            <Input
                                placeholder="Ref #"
                                value={referenceNumber}
                                onValueChange={setReferenceNumber}
                                variant="bordered"
                                radius="lg"
                                classNames={{
                                    inputWrapper: "h-[52px] border-2",
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-default-600 block px-1">
                                {t('payments.description', 'Description')}
                            </label>
                            <Textarea
                                placeholder="..."
                                value={description}
                                onValueChange={setDescription}
                                variant="bordered"
                                radius="lg"
                                classNames={{
                                    inputWrapper: "border-2",
                                }}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="border-t border-divider py-4 px-6 gap-3">
                    <Button variant="light" onPress={onClose} radius="full" className="px-6 font-bold">
                        {t('common.cancel')}
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={loading}
                        isDisabled={!amount || isAmountInvalid}
                        radius="full"
                        className="px-8 font-bold text-white shadow-lg shadow-primary/20"
                    >
                        {t('common.save')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddPaymentModal;
