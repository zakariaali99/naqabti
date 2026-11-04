import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Avatar,
  Divider,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiUser, FiClock } from 'react-icons/fi';
import { Notification } from '@/models/notifications';
import { formatDate } from '@/misc/formatDate';

interface NotificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export const NotificationPreviewModal = ({
  isOpen,
  onClose,
  notification,
}: NotificationPreviewModalProps) => {
  const { t } = useTranslation();

  if (!notification) return null;

  // Helper to format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (isRead: boolean) => {
    return isRead ? 'default' : 'primary';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg"
      backdrop="blur"
      className="max-h-[80vh] overflow-y-auto"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-3 w-full">
                <Avatar
                  icon={<FiBell size={20} />}
                  className="bg-primary/10 text-primary"
                  radius="lg"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{t('notifications.previewTitle', { defaultValue: 'Notification Preview' })}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Chip size="sm" color={getStatusColor(notification.is_read)} variant="flat">
                      {notification.is_read ? t('notifications.status.read') : t('notifications.status.unread')}
                    </Chip>
                  </div>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-6 border-y border-default-100">
              {/* Title & Content */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-default-400 uppercase tracking-wider">
                    {t('notifications.table.title')}
                  </span>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {notification.title}
                  </p>
                </div>

                <div className="space-y-1">
                   <span className="text-xs font-semibold text-default-400 uppercase tracking-wider">
                    {t('notifications.table.message')}
                  </span>
                  <div className="bg-default-50 p-4 rounded-xl border border-default-200">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>

                <Divider className="my-2" />

                {/* Recipient info if available */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-default-400 uppercase tracking-wider flex items-center gap-1">
                      <FiUser size={12} /> {t('notifications.table.recipient')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar 
                        src={notification.user?.passport_image} 
                        name={notification.user?.username} 
                        size="sm"
                        radius="full"
                      />
                      <span className="text-sm font-medium">
                        {notification.user?.full_name || notification.user?.username || t('common.unknown')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-default-400 uppercase tracking-wider flex items-center gap-1">
                      <FiClock size={12} /> {t('notifications.table.sentAt')}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                         {formatDate(notification.created_at)}
                      </span>
                      <span className="text-xs text-default-400">
                         {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                {t('common.close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
