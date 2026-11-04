import React from "react";
import { Card, CardHeader, CardBody, Divider, Chip, Avatar } from "@heroui/react";
import { FiGitBranch, FiHome, FiMapPin, FiPhone } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PublicDoctorProfile } from "@/api/publicDoctorApi";

interface DoctorAffiliationsCardProps {
  doctor: PublicDoctorProfile;
}

export const DoctorAffiliationsCard: React.FC<DoctorAffiliationsCardProps> = ({ doctor }) => {
  const { t } = useTranslation();

  const branches = doctor.branches || [];
  const institutions = doctor.institutions || [];

  if (branches.length === 0 && institutions.length === 0) {
    return null;
  }

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardHeader className="flex gap-3 px-6 pt-5 pb-3">
        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
          <FiGitBranch className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a2540]">
            {t("publicProfile.affiliations", "النقابات والمؤسسات الطبية")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("publicProfile.affiliationsSubtitle", "النقابة الفرعية والمراكز الطبية المعتمدة")}
          </p>
        </div>
      </CardHeader>
      <Divider className="opacity-60" />
      <CardBody className="px-6 py-5 space-y-5">
        {branches.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("branches.title", "النقابة الفرعية المسجل بها")}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-teal-50/80 border border-teal-200/70 text-teal-900"
                >
                  <FiMapPin className="text-teal-600 w-4 h-4 shrink-0" />
                  <span className="text-sm font-bold">{b.name}</span>
                  {b.prefix && (
                    <Chip
                      className="font-mono text-[11px] font-bold px-1"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      {b.prefix}
                    </Chip>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {institutions.length > 0 && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("institutions.title", "المستشفيات والعيادات المعتمدة")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {institutions.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 hover:border-slate-300 transition-colors"
                >
                  <Avatar
                    className="w-11 h-11 bg-white border border-slate-200 text-slate-700 shrink-0 shadow-xs"
                    fallback={<FiHome className="w-5 h-5 text-slate-500" />}
                    name={inst.name}
                    radius="md"
                    src={inst.logo || undefined}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {inst.name}
                    </p>
                    {inst.address && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <FiMapPin className="text-slate-400 shrink-0" />
                        <span className="truncate">{inst.address}</span>
                      </p>
                    )}
                    {inst.phone && (
                      <p className="text-xs font-mono text-emerald-700 flex items-center gap-1 dir-ltr text-right">
                        <FiPhone className="text-emerald-500 shrink-0" />
                        <span>{inst.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default DoctorAffiliationsCard;
