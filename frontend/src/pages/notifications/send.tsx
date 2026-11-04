import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Input,
  Button,
  Textarea,
  Switch,
  User,
} from "@heroui/react";
import { FiSend, FiArrowLeft, FiUser, FiCheckCircle, FiClock } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import notificationsApi from "@/api/notificationsApi";
import usersApi from "@/api/usersApi";
import UserSearchModal from '@/pages/users/UserSearchModal';
import { NotificationCreateInput } from "@/models";
import { UserEntity } from "@/models/users";

export default function SendNotificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<NotificationCreateInput>({
    title: '',
    message: '',
    recipient_type: 'individual',
    recipient_ids: [],
    send_now: true,
  });

  // Check for userId in query params
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const userId = queryParams.get('userId');

    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await usersApi.getById(parseInt(userId));
          const user = response.data;
          setSelectedUser(user);
          setFormData(prev => ({ ...prev, recipient_ids: [user.id] }));
          setCurrentStep(2); // Jump to Details step if userId is passed
        } catch (error) {
          console.error("Failed to fetch user for notification:", error);
        }
      };
      fetchUser();
    }
  }, []);

  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});



  // Handle form field changes
  const handleInputChange = (
    field: keyof NotificationCreateInput,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleUserSelect = (user: UserEntity | null) => {
    setSelectedUser(user);
    if (user) {
      setFormData(prev => ({ ...prev, recipient_ids: [user.id] }));
      if (errors.recipient) setErrors(prev => ({ ...prev, recipient: '' }));
    } else {
      setFormData(prev => ({ ...prev, recipient_ids: [] }));
    }
    setIsUserModalOpen(false);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!selectedUser) newErrors.recipient = t('notifications.form.selectRecipient');
    }
    if (step === 2) {
      if (!formData.title.trim()) newErrors.title = t('notifications.form.required');
      if (!formData.message.trim()) newErrors.message = t('notifications.form.required');
      else if (formData.message.length < 10) newErrors.message = t('notifications.form.messageMinLength');
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    try {
      setSendLoading(true);
      await notificationsApi.sendSingle({
        title: formData.title,
        message: formData.message,
        notification_type: 'info',
        user_id: selectedUser.id,
      });
      navigate('/notifications');
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach(key => {
          apiErrors[key] = Array.isArray(error.response.data[key]) ? error.response.data[key][0] : error.response.data[key];
        });
        setErrors(apiErrors);
      }
    } finally {
      setSendLoading(false);
    }
  };

  const steps = [
    { title: t('notifications.form.recipient'), icon: 1 },
    { title: t('notifications.form.details'), icon: 2 },
    { title: t('notifications.summary.title'), icon: 3 },
  ];

  return (
    <DefaultLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            isIconOnly
            variant="flat"
            onPress={() => navigate('/notifications')}
            className="bg-white/10"
          >
            <FiArrowLeft />
          </Button>
          <h1 className="text-3xl font-black">{t('notifications.sendSingle')}</h1>
        </div>

        <div className="mb-10 flex justify-center">
          <div className="inline-flex p-2 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10">
            <div className="flex items-center">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep === (idx + 1) ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                    currentStep > (idx + 1) ? 'bg-success text-white' : 'bg-default-100 text-default-400'
                  }`}>
                    {currentStep > (idx + 1) ? <FiCheckCircle /> : step.icon}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${currentStep === (idx + 1) ? 'text-primary' : 'text-default-400'}`}>
                    {step.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-1 hidden sm:block ${currentStep > (idx + 1) ? 'bg-success' : 'bg-default-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-default-200/50">
          <CardBody className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success">
                    <FiUser size={20} />
                  </div>
                  <h2 className="text-xl font-bold">{t('notifications.form.recipient')}</h2>
                </div>
                
                <div className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-6 ${selectedUser ? 'border-success bg-success-50/30' : 'border-dashed border-default-200 bg-white hover:border-primary/50'}`}>
                  {selectedUser ? (
                    <div className="w-full flex items-center justify-between">
                      <User
                        name={selectedUser.full_name || selectedUser.username}
                        description={selectedUser.email}
                        avatarProps={{ src: selectedUser.profile_image, size: "lg" }}
                        classNames={{ name: "text-lg font-bold" }}
                      />
                      <Button 
                        color="primary" 
                        variant="flat" 
                        onPress={() => setIsUserModalOpen(true)}
                        className="font-bold"
                      >
                         {t('common.change')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-default-50 flex items-center justify-center text-default-400">
                        <FiUser size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg mb-1">{t('notifications.form.selectRecipient')}</p>
                        <p className="text-default-500 text-sm max-w-[240px]">{t('notifications.form.recipientPlaceholder')}</p>
                      </div>
                      <Button 
                        color="primary" 
                        size="lg" 
                        onPress={() => setIsUserModalOpen(true)}
                        className="font-bold px-8"
                      >
                        {t('notifications.form.selectRecipient')}
                      </Button>
                    </>
                  )}
                </div>
                {errors.recipient && <p className="text-danger text-sm font-medium text-center">{errors.recipient}</p>}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
                      <FiSend size={20} />
                    </div>
                    <h2 className="text-xl font-bold">{t('notifications.form.details')}</h2>
                  </div>
                  {selectedUser && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-success-50 rounded-full border border-success-200">
                      <FiUser className="text-success" size={14} />
                      <span className="text-xs font-bold text-success-700">
                        {selectedUser.full_name || selectedUser.username}
                      </span>
                    </div>
                  )}
                </div>
                <Input
                  label={t('notifications.form.title')}
                  placeholder={t('notifications.form.titlePlaceholder')}
                  value={formData.title}
                  onValueChange={(val) => handleInputChange('title', val)}
                  isInvalid={!!errors.title}
                  errorMessage={errors.title}
                  isRequired
                  variant="bordered"
                  size="lg"
                />
                <Textarea
                  label={t('notifications.form.message')}
                  placeholder={t('notifications.form.messagePlaceholder')}
                  value={formData.message}
                  onValueChange={(val) => handleInputChange('message', val)}
                  isInvalid={!!errors.message}
                  errorMessage={errors.message}
                  isRequired
                  minRows={6}
                  variant="bordered"
                  size="lg"
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary">
                    <FiCheckCircle size={20} />
                  </div>
                  <h2 className="text-xl font-bold">{t('notifications.summary.title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="p-6 bg-default-50 rounded-[2.5rem] border border-default-100">
                         <p className="text-default-400 text-xs font-black uppercase mb-4 tracking-widest">Recipient</p>
                         <User
                            name={selectedUser?.full_name || selectedUser?.username}
                            description={selectedUser?.email}
                            avatarProps={{ src: selectedUser?.profile_image }}
                         />
                      </div>
                   </div>

                   <div className="p-8 border-2 border-default-100 rounded-[2.5rem] space-y-6">
                      <div>
                        <p className="text-xs text-default-400 font-black uppercase tracking-widest mb-2">{t('notifications.form.title')}</p>
                        <p className="text-xl font-bold">{formData.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-default-400 font-black uppercase tracking-widest mb-2">{t('notifications.form.message')}</p>
                        <p className="text-default-600 leading-relaxed line-clamp-4">{formData.message}</p>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-warning-50 rounded-[2rem] border border-warning-100">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <FiClock className="text-warning-600" />
                         <div>
                            <p className="font-bold text-warning-900">{t('notifications.form.sendNow')}</p>
                            <p className="text-xs text-warning-700">Notification will be delivered immediately</p>
                         </div>
                      </div>
                      <Switch isSelected={formData.send_now} onValueChange={(v) => handleInputChange('send_now', v)} color="warning" />
                   </div>
                   {!formData.send_now && (
                      <Input
                        type="datetime-local"
                        className="mt-4"
                        value={formData.scheduled_for || ''}
                        onValueChange={(v) => handleInputChange('scheduled_for', v)}
                      />
                   )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-default-100">
              <Button
                variant="light"
                onPress={() => currentStep > 1 ? handleBack() : navigate('/notifications')}
                size="lg"
                className="font-semibold"
              >
                {currentStep === 1 ? t('common.cancel') : t('common.back')}
              </Button>
              
              <Button
                color="primary"
                onPress={currentStep < 3 ? handleNext : handleSubmit}
                isLoading={sendLoading}
                size="lg"
                className="px-10 font-black shadow-xl shadow-primary/30"
                startContent={currentStep === 3 ? <FiSend /> : null}
              >
                {t(currentStep < 3 ? 'common.next' : 'notifications.form.send')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <UserSearchModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSelect={handleUserSelect}
      />
    </DefaultLayout>
  );
}
