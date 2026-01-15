"use client"

import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { PageTransition } from "@/components/page-transition"

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 pb-20 overflow-x-hidden">
                <PageTransition>{children}</PageTransition>
            </main>
            <BottomNav />
        </div>
    )
}
