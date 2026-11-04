import React from "react";
import { Card, CardHeader, CardBody, Divider, Button, Chip } from "@heroui/react";
import { FiAward, FiExternalLink, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PublicDoctorProfile } from "@/api/publicDoctorApi";

interface DoctorCertificationsCardProps {
  doctor: PublicDoctorProfile;
}

export const DoctorCertificationsCard: React.FC<DoctorCertificationsCardProps> = ({
  doctor,
}) => {
  const { t } = useTranslation();

  const certifications = doctor.certifications || [];

  if (certifications.length === 0) {
    return null;
  }

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardHeader className="flex gap-3 px-6 pt-5 pb-3">
        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
          <FiAward className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a2540]">
            {t("publicProfile.certifications", "الشهادات والتراخيص المعتمدة")}
          </h2>
          <p className="text-xs text-slate-500">
            {t(
              "publicProfile.certificationsSubtitle",
              "التراخيص المهنية والشهادات المسجلة رسمياً لدى النقابة"
            )}
          </p>
        </div>
      </CardHeader>
      <Divider className="opacity-60" />
      <CardBody className="px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="relative flex flex-col justify-between gap-3 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/70 hover:border-amber-200 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-800 shrink-0">
                      <FiAward className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {cert.type_name}
                    </p>
                  </div>
                  <Chip
                    className="text-[10px] font-bold shrink-0"
                    color="success"
                    size="sm"
                    startContent={<FiCheckCircle className="ml-0.5" />}
                    variant="flat"
                  >
                    {t("publicProfile.verifiedBadge", "معتمد")}
                  </Chip>
                </div>

                {cert.issued_from && (
                  <p className="text-xs text-slate-600 pr-7 font-medium">
                    {t("certifications.table.issuedFrom", "جهة الإصدار")}:{" "}
                    <span className="text-slate-900">{cert.issued_from}</span>
                  </p>
                )}

                {cert.issue_date && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pr-7">
                    <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cert.issue_date}</span>
                    {cert.expiry_date && <span>— {cert.expiry_date}</span>}
                  </p>
                )}
              </div>

              {cert.document_url && (
                <Button
                  as="a"
                  className="w-full text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/60"
                  endContent={<FiExternalLink />}
                  href={cert.document_url}
                  rel="noopener noreferrer"
                  size="sm"
                  target="_blank"
                  variant="flat"
                >
                  {t("publicProfile.viewDocument", "معاينة الوثيقة الرسمية")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default DoctorCertificationsCard;
