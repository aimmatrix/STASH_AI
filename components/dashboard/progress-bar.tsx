"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number; // 0 to 100
    className?: string;
    colorClass?: string;
}

export function ProgressBar({ value, className, colorClass = "bg-primary" }: ProgressBarProps) {
    return (
        <div className={cn("w-full bg-white/10 h-2 rounded-full overflow-hidden", className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={cn("h-full", colorClass)}
            />
        </div>
    );
}
