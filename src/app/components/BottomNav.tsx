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
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-nav">
      <div className="bg-paper-2 border-t border-rule shadow-nav">
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
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg min-h-[44px]
                  transition-colors duration-short ease-out
                  focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px]
                  active:scale-[0.97] ${
                    isActive ? "text-accent" : "text-muted hover:text-ink-2"
                  }`}
              >
                {isActive && (
                  <span className="absolute top-0.5 w-6 h-[3px] bg-accent rounded-full" />
                )}
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
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
