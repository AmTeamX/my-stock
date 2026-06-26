"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, Boxes, ClipboardList, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "เบิก", Icon: Send },
  { href: "/manage", label: "จัดการ", Icon: Boxes },
  { href: "/history", label: "ประวัติ", Icon: ClipboardList },
  { href: "/settings", label: "ตั้งค่า", Icon: Settings },
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
          {navItems.map(({ href, label, Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg min-h-[44px] transition-colors duration-short ease-out focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px] active:scale-[0.97] ${isActive ? "text-accent" : "text-muted hover:text-ink-2"}`}
              >
                {isActive && (
                  <span className="absolute top-0.5 w-6 h-[3px] bg-accent rounded-full" />
                )}
                <Icon size={20} strokeWidth={2} />
                <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
