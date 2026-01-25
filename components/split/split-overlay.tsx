"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { splitBill, MOCK_FRIENDS } from "@/lib/transfer-logic";
import { SuccessCheck } from "@/components/feedback/success-check";
import { cn } from "@/lib/utils";

interface SplitOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    transactionAmount: number;
    transactionId: string;
}

export function SplitOverlay({ isOpen, onClose, transactionAmount, transactionId }: SplitOverlayProps) {
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const toggleFriend = (id: string) => {
        setSelectedFriends((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    const handleSplit = async () => {
        if (selectedFriends.length === 0) return;
        setStatus("loading");
        await splitBill(transactionId, Math.abs(transactionAmount), selectedFriends);
        setStatus("success");
        setTimeout(() => {
            setStatus("idle");
            setSelectedFriends([]);
            onClose();
        }, 2000);
    };

    const splitAmount = Math.abs(transactionAmount) / (selectedFriends.length + 1);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-white/10 p-6 z-50 pb-10"
                    >
                        {status === "success" ? (
                            <div className="h-64 flex flex-col items-center justify-center">
                                <SuccessCheck />
                                <p className="text-zinc-400 mt-2">Split request sent!</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Split Expense</h2>
                                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                                        <X className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </div>

                                <div className="mb-8 text-center">
                                    <p className="text-zinc-400 mb-1">Total Amount</p>
                                    <p className="text-4xl font-bold text-white">${Math.abs(transactionAmount).toFixed(2)}</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <p className="text-sm font-medium text-zinc-400">Select friends to split with:</p>
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                                        {MOCK_FRIENDS.map((friend) => {
                                            const isSelected = selectedFriends.includes(friend.id);
                                            return (
                                                <button
                                                    key={friend.id}
                                                    onClick={() => toggleFriend(friend.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 min-w-[80px] p-4 rounded-xl border transition-all",
                                                        isSelected
                                                            ? "bg-emerald-500/10 border-emerald-500"
                                                            : "bg-white/5 border-transparent hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", isSelected ? "bg-emerald-500 text-black" : "bg-zinc-700 text-zinc-300")}>
                                                        {friend.name[0]}
                                                    </div>
                                                    <span className={cn("text-xs font-medium", isSelected ? "text-emerald-400" : "text-zinc-400")}>{friend.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 mb-6 flex justify-between items-center">
                                    <span className="text-zinc-400">Total per person</span>
                                    <span className="text-xl font-bold text-white">${splitAmount.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleSplit}
                                    disabled={selectedFriends.length === 0 || status === "loading"}
                                    className={cn(
                                        "w-full h-14 rounded-full font-bold text-lg flex items-center justify-center transition-all",
                                        selectedFriends.length > 0
                                            ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    )}
                                >
                                    {status === "loading" ? "Processing..." : `Split with ${selectedFriends.length} people`}
                                </button>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
