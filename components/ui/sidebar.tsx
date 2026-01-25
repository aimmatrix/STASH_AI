"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, LogOut, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    // Lock body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 z-50 w-3/4 max-w-sm bg-card border-r border-white/10 p-6 flex flex-col shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                Settings
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
                            >
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-2">
                            <Link
                                href="/settings"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors"
                            >
                                <Settings size={20} strokeWidth={1.5} />
                                <span>General Settings</span>
                            </Link>
                            <Link
                                href="/help"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors"
                            >
                                <HelpCircle size={20} strokeWidth={1.5} />
                                <span>Help & Support</span>
                            </Link>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <button className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors">
                                <LogOut size={20} strokeWidth={1.5} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
