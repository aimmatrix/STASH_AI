"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Keypad } from "@/components/transfer/keypad";
import { SuccessCheck } from "@/components/feedback/success-check";
import { performTransfer } from "@/lib/transfer-logic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransferPage() {
    const router = useRouter();
    const [amount, setAmount] = useState("0");
    const [isDepositing, setIsDepositing] = useState(true); // true = Safe to Spend -> Locked Pot, false = reverse
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleKeyPress = (key: string) => {
        if (amount === "0" && key !== ".") {
            setAmount(key);
        } else {
            if (key === "." && amount.includes(".")) return;
            if (amount.replace(".", "").length >= 6) return; // Limit length
            setAmount(amount + key);
        }
    };

    const handleDelete = () => {
        if (amount.length === 1) {
            setAmount("0");
        } else {
            setAmount(amount.slice(0, -1));
        }
    };

    const handleConfirm = async () => {
        const numAmount = parseFloat(amount);
        if (numAmount <= 0) return;

        setStatus("loading");
        // Mock transfer to a generic "Bill Pot" for now
        await performTransfer(numAmount, isDepositing ? null : "mock-pot", isDepositing ? "mock-pot" : null);
        setStatus("success");

        setTimeout(() => {
            router.push("/"); // Return to dashboard
        }, 2000);
    };

    const toggleDirection = () => {
        setIsDepositing(!isDepositing);
    };

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <SuccessCheck />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-white p-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => router.back()} className="text-zinc-400 font-medium">Cancel</button>
                <h1 className="font-bold text-lg">Transfer</h1>
                <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Direction Toggle */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-full px-6">
                    <span className={cn("text-sm font-medium transition-colors", isDepositing ? "text-emerald-400" : "text-zinc-500")}>
                        Safe to Spend
                    </span>
                    <button
                        onClick={toggleDirection}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <ArrowUpDown className="w-4 h-4 text-white" />
                    </button>
                    <span className={cn("text-sm font-medium transition-colors", !isDepositing ? "text-amber-400" : "text-zinc-500")}>
                        Locked Pot
                    </span>
                </div>
            </div>

            {/* Amount Display */}
            <div className="flex-1 flex items-center justify-center mb-10">
                <div className="text-center">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={amount}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-7xl font-bold tracking-tighter"
                        >
                            <span className="text-zinc-600">$</span>
                            {amount}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Keypad */}
            <Keypad
                onKeyPress={handleKeyPress}
                onDelete={handleDelete}
                onConfirm={handleConfirm}
                isValid={parseFloat(amount) > 0}
            />

            {/* Confirm Button */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleConfirm}
                    disabled={parseFloat(amount) <= 0 || status === "loading"}
                    className={cn(
                        "w-full max-w-xs h-14 rounded-full font-bold text-lg flex items-center justify-center transition-all",
                        parseFloat(amount) > 0
                            ? "bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 active:scale-95"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                >
                    {status === "loading" ? <Loader2 className="animate-spin" /> : "Confirm Transfer"}
                </button>
            </div>

        </div>
    );
}
