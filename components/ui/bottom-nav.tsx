"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Spending", icon: CreditCard, href: "/spending" },
    { label: "Chat", icon: MessageSquare, href: "/chat" },
    { label: "Profile", icon: User, href: "/profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-card/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] pt-2 nav-glass">
            <div className="flex justify-around items-center">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 transition-colors duration-200 tap-active",
                                isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <item.icon
                                size={24}
                                strokeWidth={1.5}
                                className={cn("transition-transform duration-200", isActive && "scale-110")}
                            />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
