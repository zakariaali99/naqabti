import { useTranslation } from "react-i18next";

interface PieChartProps {
  doctors: number;
  students: number;
  institutions: number;
  size?: number;
}

export const PieChart = ({
  doctors,
  students,
  institutions,
  size = 180,
}: PieChartProps) => {
  const { t } = useTranslation();
  const total = doctors + students + institutions;
  const radius = size / 2 - 20; // Thicker border
  const circumference = 2 * Math.PI * radius;
  const segments = [doctors, students, institutions];
  const colors = ["#ffffff", "#ffffff", "#ffffff"]; // We'll use opacity for variation
  const opacities = [1, 0.6, 0.3];
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <g transform={`translate(${size / 2},${size / 2})`}>
          {total === 0 ? (
            <circle
              cx={0}
              cy={0}
              fill="none"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={24}
            />
          ) : (
            segments.map((value, i) => {
              const dash = (value / total) * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const dashOffset = offset;

              offset += dash;

              return (
                <circle
                  key={i}
                  className="transition-all duration-1000 ease-out"
                  cx={0}
                  cy={0}
                  fill="none"
                  r={radius}
                  stroke={colors[i]}
                  strokeDasharray={dashArray}
                  strokeDashoffset={-dashOffset}
                  strokeLinecap="round"
                  strokeOpacity={opacities[i]}
                  strokeWidth={32}
                />
              );
            })
          )}
        </g>
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
        <span className="text-3xl font-bold">{total}</span>
        <span className="text-xs opacity-70 uppercase tracking-wider">
          {t("common.total", "Total")}
        </span>
      </div>
    </div>
  );
};
