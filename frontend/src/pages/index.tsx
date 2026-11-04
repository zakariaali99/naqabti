import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import DefaultLayout from "@/layouts/default";
import { Logo } from "@/components/icons";

const shortcuts = [
  { label: "Home", href: "/" },
  { label: "People", href: "/people" },
  { label: "Items", href: "/items" },
  { label: "Users", href: "/users" },
];

const stats = [
  { label: "Total People", value: 128 },
  { label: "Total Items", value: 342 },
  { label: "Total Users", value: 12 },
];

export default function IndexPage() {
  return (
    <DefaultLayout>
      <div className="relative flex flex-col items-center justify-center min-h-[70vh] py-12">
        {/* Watermark Logo */}
        <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-10 z-0">
          <Logo className="text-primary" size={320} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-10">
          {/* Shortcut Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                className={buttonStyles({
                  color: "primary",
                  size: "lg",
                  radius: "full",
                  variant: "shadow",
                })}
                href={s.href}
              >
                {s.label}
              </Link>
            ))}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-black/40 rounded-xl shadow p-6 flex flex-col items-center border border-divider"
              >
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-base text-default-700 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
