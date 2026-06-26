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
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2
                ${isActive ? "text-[#06C755]" : "text-gray-400"}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
