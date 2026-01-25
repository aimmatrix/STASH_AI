"use client";

import { motion } from "framer-motion";

interface DashboardHeroProps {
    safeToSpend: number;
}

export function DashboardHero({ safeToSpend }: DashboardHeroProps) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(safeToSpend);

    return (
        <div className="flex flex-col items-center justify-center py-10 md:py-16 space-y-2 text-center">
            <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-widest"
            >
                Safe to Spend Today
            </motion.span>
            <motion.h1
                initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2
                }}
                className="text-6xl md:text-8xl lg:text-9xl font-bold text-emerald-500 tracking-tighter drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
                {formatted}
            </motion.h1>
        </div>
    );
}
