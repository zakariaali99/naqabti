import React, { useState } from "react";
import { Avatar, Chip, Button, Tooltip } from "@heroui/react";
import {
  FiCheckCircle,
  FiShare2,
  FiCheck,
  FiMapPin,
  FiAward,
  FiPhone,
  FiMail,
  FiMaximize2,
  FiShield,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PublicDoctorProfile } from "@/api/publicDoctorApi";
import DoctorQrCodeModal from "./DoctorQrCodeModal";

interface DoctorHeaderCardProps {
  doctor: PublicDoctorProfile;
}

export const DoctorHeaderCard: React.FC<DoctorHeaderCardProps> = ({ doctor }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryBranch =
    doctor.branches && doctor.branches.length > 0 ? doctor.branches[0] : null;

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-md transition-all">
        {/* Top Hero Banner with Geometric Medical Mesh Gradient */}
        <div className="relative h-36 sm:h-44 bg-gradient-to-r from-[#0a2540] via-[#0f3b60] to-[#0d9488] overflow-hidden">
          {/* Subtle Grid Accent Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Top Verification Seal Ribbon */}
          <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-medium">
            <FiShield className="text-emerald-400 w-3.5 h-3.5" />
            <span>{t("publicProfile.verifiedDoctor", "طبيب معتمد رسمياً")}</span>
          </div>
        </div>

        {/* Doctor Identity Area */}
        <div className="relative px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-right">
              <div className="relative">
                <Avatar
                  className="w-28 h-28 sm:w-36 sm:h-36 text-large ring-4 ring-white shadow-xl bg-slate-100 shrink-0"
                  color="primary"
                  name={doctor.full_name || doctor.username}
                  src={doctor.profile_image_url || undefined}
                />
                <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 bg-emerald-500 ring-4 ring-white rounded-full flex items-center justify-center text-white text-[10px]">
                  <FiCheck className="w-3 h-3 stroke-[3]" />
                </span>
              </div>

              <div className="space-y-1.5 pt-2 sm:pt-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] tracking-tight">
                    {doctor.full_name || `@${doctor.username}`}
                  </h1>
                  <Chip
                    className="font-semibold text-xs py-1"
                    color="success"
                    size="sm"
                    startContent={<FiCheckCircle className="ml-1" />}
                    variant="flat"
                  >
                    {t("publicProfile.activeMembership", "عضوية سارية")}
                  </Chip>
                </div>

                {doctor.specialty && (
                  <p className="text-base font-semibold text-teal-700">
                    {doctor.specialty}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-slate-500 pt-0.5">
                  {doctor.full_doctor_number && (
                    <span className="flex items-center gap-1 font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                      <FiAward className="text-blue-600" />
                      {doctor.full_doctor_number}
                    </span>
                  )}
                  {primaryBranch && (
                    <span className="flex items-center gap-1 bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-100">
                      <FiMapPin className="text-teal-600" />
                      {primaryBranch.name}
                    </span>
                  )}
                  {doctor.degree_name && (
                    <span className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-100 font-medium">
                      {doctor.degree_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              {doctor.phone_number && (
                <Button
                  as="a"
                  className="font-semibold text-xs bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                  href={`tel:${doctor.phone_number}`}
                  size="sm"
                  startContent={<FiPhone className="w-3.5 h-3.5" />}
                  variant="solid"
                >
                  {t("publicProfile.callDirect", "اتصال مباشر")}
                </Button>
              )}

              {doctor.email && (
                <Button
                  as="a"
                  className="font-medium text-xs text-slate-700 bg-slate-100 hover:bg-slate-200"
                  href={`mailto:${doctor.email}`}
                  size="sm"
                  startContent={<FiMail className="w-3.5 h-3.5" />}
                  variant="flat"
                >
                  {t("publicProfile.sendEmail", "بريد")}
                </Button>
              )}

              <Button
                className="font-medium text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60"
                size="sm"
                startContent={<FiMaximize2 className="w-3.5 h-3.5" />}
                variant="flat"
                onPress={() => setQrModalOpen(true)}
              >
                {t("publicProfile.digitalCard", "بطاقة QR")}
              </Button>

              <Tooltip
                content={
                  copied
                    ? t("publicProfile.copied", "تم النسخ!")
                    : t("publicProfile.copyLink", "نسخ الرابط")
                }
              >
                <Button
                  className="font-medium text-xs"
                  color={copied ? "success" : "default"}
                  size="sm"
                  startContent={copied ? <FiCheck /> : <FiShare2 />}
                  variant="flat"
                  onPress={handleShare}
                >
                  {copied
                    ? t("publicProfile.copied", "تم النسخ")
                    : t("publicProfile.share", "مشاركة")}
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Digital Card Modal */}
      <DoctorQrCodeModal
        doctor={doctor}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </>
  );
};

export default DoctorHeaderCard;
