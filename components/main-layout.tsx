"use client";

import { useState } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Sidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
            {/* Mobile Header for Sidebar Trigger (Temporary until explicit design) */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-white/5">
                <div className="text-lg font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                    Stash AI
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <Menu size={24} strokeWidth={1.5} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 p-4 scrollbar-hide">
                {children}
            </main>

            {/* Global Navigation components */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <BottomNav />
        </div>
    );
}
