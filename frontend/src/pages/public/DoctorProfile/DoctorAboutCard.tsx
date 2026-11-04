import React from "react";
import { Card, CardHeader, CardBody, Divider } from "@heroui/react";
import { FiUser, FiBookOpen, FiAward } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PublicDoctorProfile } from "@/api/publicDoctorApi";

interface DoctorAboutCardProps {
  doctor: PublicDoctorProfile;
}

export const DoctorAboutCard: React.FC<DoctorAboutCardProps> = ({ doctor }) => {
  const { t } = useTranslation();

  const hasBio = Boolean(doctor.bio);
  const hasDegree = Boolean(doctor.degree_name);
  const hasUniversity = Boolean(doctor.university_name);

  if (!hasBio && !hasDegree && !hasUniversity) {
    return null;
  }

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardHeader className="flex gap-3 px-6 pt-5 pb-3">
        <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
          <FiUser className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a2540]">
            {t("publicProfile.aboutDoctor", "عن الطبيب")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("publicProfile.aboutSubtitle", "البيانات المهنية والتخصص الأكاديمي")}
          </p>
        </div>
      </CardHeader>
      <Divider className="opacity-60" />
      <CardBody className="px-6 py-5 space-y-5 text-slate-700">
        {hasBio && (
          <div className="relative pr-4 border-r-2 border-teal-500/40 space-y-1">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              {t("publicProfile.bio", "النبذة التعريفية")}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line text-slate-800 font-normal">
              {doctor.bio}
            </p>
          </div>
        )}

        {(hasDegree || hasUniversity) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {hasDegree && (
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                  <FiAward className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    {t("publicProfile.degree", "الدرجة العلمية المعتمدة")}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {doctor.degree_name}
                  </p>
                </div>
              </div>
            )}

            {hasUniversity && (
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                  <FiBookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    {t("publicProfile.university", "الجامعة")}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {doctor.university_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default DoctorAboutCard;
