"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Wallet, MessageSquare, User } from "lucide-react"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            label: "Dashboard",
            href: "/",
            icon: LayoutGrid,
        },
        {
            label: "Accounts",
            href: "/accounts",
            icon: Wallet,
        },
        {
            label: "Coach",
            href: "/coach",
            icon: MessageSquare,
        },
        {
            label: "Settings",
            href: "/settings",
            icon: User,
        },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] space-y-1 ${isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon
                                strokeWidth={1.5}
                                className={`h-6 w-6 transition-colors ${isActive ? "text-accent" : "text-current"}`}
                            />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
