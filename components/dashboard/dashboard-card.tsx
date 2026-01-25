"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    title?: string;
}

export function DashboardCard({ children, className, onClick, title }: DashboardCardProps) {
    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
                "bg-card border border-white/5 rounded-2xl p-6 shadow-sm hover:border-primary/20 transition-colors flex flex-col h-full cursor-pointer relative overflow-hidden group",
                className
            )}
            onClick={onClick}
        >
            {title && <h3 className="text-sm font-medium text-zinc-400 mb-2 z-10 relative">{title}</h3>}
            <div className="z-10 relative flex-1 flex flex-col">{children}</div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
}
