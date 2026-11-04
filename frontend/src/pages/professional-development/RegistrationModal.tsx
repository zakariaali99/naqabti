import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Checkbox,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';
import { ProfessionalDevelopmentRegistration } from '@/models/professionalDevelopment';
import { UserEntity } from '@/models/users';
import UserSearchModal from '../users/UserSearchModal';
import professionalDevelopmentApi from '@/api/professionalDevelopmentApi';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pdId: number;
    registration?: ProfessionalDevelopmentRegistration | null;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    pdId,
    registration,
}) => {
    const { t } = useTranslation();
    const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<UserEntity | null>(null);
    const [status, setStatus] = useState('pending');
    const [sendNotification, setSendNotification] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (registration) {
            setSelectedDoctor(registration.doctor_details as any);
            setStatus(registration.status);
            setSendNotification(false); // Default to false for edits
        } else {
            setSelectedDoctor(null);
            setStatus('confirmed');
            setSendNotification(true);
        }
    }, [registration, isOpen]);

    const handleSave = async () => {
        if (!selectedDoctor && !registration) return;

        try {
            setLoading(true);
            if (registration) {
                await professionalDevelopmentApi.updatePDRegistration(registration.id, {
                    status: status as 'pending' | 'confirmed' | 'cancelled',
                });
            } else {
                await professionalDevelopmentApi.addPDRegistration(pdId, {
                    doctor_id: selectedDoctor!.id,
                    status: status,
                    send_notification: sendNotification,
                });
            }
            onSuccess();
            onClose();
            toast.success(registration ? t('common.updatedSuccessfully') : t('professionalDevelopment.registeredSuccessfully'));
        } catch (error: any) {
            console.error('Failed to save registration:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.detail || t('common.error');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal 
                isOpen={isOpen} 
                onClose={onClose}
                size="md"
                backdrop="blur"
                className="rounded-[32px]"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 text-2xl font-black">
                        {registration ? t('common.edit') : t('professionalDevelopment.addRegistration')}
                        <p className="text-sm font-normal text-default-400">
                            {registration ? t('professionalDevelopment.editItem') : t('professionalDevelopment.addRegistrationDesc')}
                        </p>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="space-y-6">
                            {!registration && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-default-600 block px-1">
                                        {t('professionalDevelopment.doctor')}
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 px-4 py-3 border-2 border-default-100 rounded-2xl bg-default-50 flex items-center min-h-[52px]">
                                            {selectedDoctor ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                                                        {selectedDoctor.full_name?.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-foreground">{selectedDoctor.full_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-default-400 italic text-sm">{t('professionalDevelopment.selectDoctor')}</span>
                                            )}
                                        </div>
                                        <Button 
                                            onPress={() => setIsUserSearchOpen(true)}
                                            isIconOnly
                                            className="h-[52px] w-[52px] rounded-2xl bg-primary text-white shadow-lg shadow-primary/30"
                                        >
                                            <FiPlus />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-default-600 block px-1">
                                    {t('professionalDevelopment.status')}
                                </label>
                                <Select
                                    placeholder={t('professionalDevelopment.selectStatus')}
                                    selectedKeys={[status]}
                                    onChange={(e: any) => setStatus(e.target.value)}
                                    variant="bordered"
                                    radius="lg"
                                    classNames={{
                                        trigger: "h-[52px] border-2",
                                    }}
                                >
                                    <SelectItem key="pending">{t('professionalDevelopment.statusPending')}</SelectItem>
                                    <SelectItem key="confirmed">{t('professionalDevelopment.statusConfirmed')}</SelectItem>
                                    <SelectItem key="cancelled">{t('professionalDevelopment.statusCancelled')}</SelectItem>
                                </Select>
                            </div>

                            <div className="px-1">
                                <Checkbox 
                                    isSelected={sendNotification} 
                                    onValueChange={setSendNotification}
                                    color="primary"
                                    classNames={{
                                        label: "text-sm font-medium text-default-600"
                                    }}
                                >
                                    {t('professionalDevelopment.sendNotification')}
                                </Checkbox>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="border-t border-divider py-4 px-6 gap-3">
                        <Button variant="light" onPress={onClose} radius="full" className="px-6 font-bold">
                            {t('common.cancel')}
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleSave}
                            isLoading={loading}
                            isDisabled={!selectedDoctor && !registration}
                            radius="full"
                            className="px-8 font-bold text-white shadow-lg shadow-primary/20"
                        >
                            {registration ? t('common.save') : t('professionalDevelopment.confirmEnrollment')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <UserSearchModal
                isOpen={isUserSearchOpen}
                onClose={() => setIsUserSearchOpen(false)}
                onSelect={(user) => {
                    setSelectedDoctor(user);
                    setIsUserSearchOpen(false);
                }}
            />
        </>
    );
};

export default RegistrationModal;
