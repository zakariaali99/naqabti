import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FiSend, FiBell } from 'react-icons/fi';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    title: string;
    message: string;
    notification_type: string;
    send_to_all_devices?: boolean;
  }) => Promise<void>;
  title?: string;
  defaultTitle?: string;
  defaultMessage?: string;
  showBroadcastOption?: boolean;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  onSend,
  title,
  defaultTitle = '',
  defaultMessage = '',
  showBroadcastOption = false,
}) => {
  const { t } = useTranslation();
  const [notificationTitle, setNotificationTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [type, setType] = useState('info');
  const [broadcast, setBroadcast] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNotificationTitle(defaultTitle);
      setMessage(defaultMessage);
      setBroadcast(false);
    }
  }, [isOpen, defaultTitle, defaultMessage]);

  const handleSend = async () => {
    if (!notificationTitle || !message) return;

    try {
      setLoading(true);
      await onSend({
        title: notificationTitle,
        message,
        notification_type: type,
        send_to_all_devices: showBroadcastOption ? broadcast : false,
      });
      onClose();
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FiBell className="text-primary" />
                <span>{title || t('notifications.title')}</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label={t('notifications.form.title')}
                  placeholder={t('notifications.form.titlePlaceholder')}
                  value={notificationTitle}
                  onValueChange={setNotificationTitle}
                  isRequired
                />
                
                <Textarea
                  label={t('notifications.form.message')}
                  placeholder={t('notifications.form.messagePlaceholder')}
                  value={message}
                  onValueChange={setMessage}
                  isRequired
                  rows={4}
                />

                <Select
                  label={t('notifications.form.type')}
                  selectedKeys={[type]}
                  onSelectionChange={(keys) => setType(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="info" startContent={<div className="w-2 h-2 rounded-full bg-primary" />}>
                    {t('notifications.types.info')}
                  </SelectItem>
                  <SelectItem key="warning" startContent={<div className="w-2 h-2 rounded-full bg-warning" />}>
                    {t('notifications.types.warning')}
                  </SelectItem>
                  <SelectItem key="success" startContent={<div className="w-2 h-2 rounded-full bg-success" />}>
                    {t('notifications.types.success')}
                  </SelectItem>
                  <SelectItem key="error" startContent={<div className="w-2 h-2 rounded-full bg-danger" />}>
                    {t('notifications.types.error')}
                  </SelectItem>
                </Select>

                {showBroadcastOption && (
                  <div className="flex flex-col gap-2 p-3 bg-default-50 rounded-xl border border-default-200">
                    <Checkbox isSelected={broadcast} onValueChange={setBroadcast}>
                      {t('notifications.form.sendToAllUsers')}
                    </Checkbox>
                    <p className="text-xs text-default-500 ml-7">
                      {t('notifications.form.broadcastWarning')}
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                color="primary"
                startContent={<FiSend />}
                isLoading={loading}
                onPress={handleSend}
                isDisabled={!notificationTitle || !message}
              >
                {t('common.send')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
