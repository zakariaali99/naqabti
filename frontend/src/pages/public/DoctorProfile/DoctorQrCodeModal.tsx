import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
  Chip,
  Tooltip,
} from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import {
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiShield,
  FiAward,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PublicDoctorProfile } from "@/api/publicDoctorApi";

interface DoctorQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: PublicDoctorProfile;
}

export const DoctorQrCodeModal: React.FC<DoctorQrCodeModalProps> = ({
  isOpen,
  onClose,
  doctor,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/doctors/${doctor.username}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-sm",
        header: "border-b border-slate-100 pb-3",
        footer: "border-t border-slate-100 pt-3",
      }}
      isOpen={isOpen}
      placement="center"
      onClose={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center items-center pt-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md mb-1">
                <FiShield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("publicProfile.digitalCard", "بطاقة التحقق الرقمية")}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {t(
                  "publicProfile.digitalCardDesc",
                  "امسح رمز الاستجابة السريعة للوصول المباشر للملف المهني المعتمد"
                )}
              </p>
            </ModalHeader>

            <ModalBody className="py-5 flex flex-col items-center gap-4">
              {/* Doctor Mini Identity */}
              <div className="flex items-center gap-3 w-full p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                <Avatar
                  className="w-12 h-12 ring-2 ring-blue-500/20 shrink-0"
                  color="primary"
                  name={doctor.full_name || doctor.username}
                  src={doctor.profile_image_url || undefined}
                />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {doctor.full_name || `@${doctor.username}`}
                  </p>
                  <p className="text-xs font-medium text-blue-600 truncate">
                    {doctor.specialty || t("publicProfile.verifiedDoctor", "طبيب معتمد")}
                  </p>
                  {doctor.full_doctor_number && (
                    <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                      <FiAward className="text-slate-400" />
                      {doctor.full_doctor_number}
                    </p>
                  )}
                </div>
                <Chip
                  color="success"
                  size="sm"
                  startContent={<FiCheckCircle className="ml-0.5" />}
                  variant="flat"
                >
                  {t("publicProfile.verifiedBadge", "معتمد")}
                </Chip>
              </div>

              {/* QR Code Container */}
              <div className="p-5 rounded-3xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center">
                <QRCodeSVG
                  bgColor="#ffffff"
                  fgColor="#0a2540"
                  includeMargin={false}
                  level="Q"
                  size={190}
                  value={profileUrl}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-mono text-slate-500 dir-ltr select-all break-all px-2">
                  {profileUrl}
                </p>
              </div>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between gap-2 px-6 pb-6">
              <Button
                className="text-xs font-medium"
                size="sm"
                variant="flat"
                onPress={onClose}
              >
                {t("common.close", "إغلاق")}
              </Button>
              <Tooltip
                content={
                  copied
                    ? t("publicProfile.copied", "تم النسخ!")
                    : t("publicProfile.copyLink", "نسخ الرابط")
                }
              >
                <Button
                  className="text-xs font-semibold"
                  color={copied ? "success" : "primary"}
                  size="sm"
                  startContent={copied ? <FiCheck /> : <FiCopy />}
                  variant="solid"
                  onPress={handleCopy}
                >
                  {copied
                    ? t("publicProfile.copied", "تم النسخ")
                    : t("publicProfile.copyLink", "نسخ الرابط")}
                </Button>
              </Tooltip>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default DoctorQrCodeModal;
