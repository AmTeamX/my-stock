"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Stock", icon: "📦" },
  { href: "/add", label: "เพิ่ม", icon: "➕" },
  { href: "/history", label: "ประวัติ", icon: "📋" },
  { href: "/settings", label: "ตั้งค่า", icon: "⚙️" },
];

interface BottomNavProps {
  current: string;
}

export default function BottomNav({ current }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
      {/* Safe area padding for iPhone */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-nav">
        <div className="flex justify-around items-center h-[4.25rem] px-1 pb-safe">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-2xl
                  transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "text-[#06C755]"
                      : "text-gray-400 hover:text-gray-500"
                  }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -top-0.5 w-8 h-1 bg-[#06C755] rounded-full" />
                )}
                <span
                  className={`text-xl transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-semibold ${isActive ? "" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
