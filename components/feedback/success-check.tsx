"use client";

import { motion } from "framer-motion";

export function SuccessCheck() {
    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                >
                    <motion.svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                </motion.div>
            </div>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white text-xl font-bold tracking-tight"
            >
                Success!
            </motion.p>
        </div>
    );
}
