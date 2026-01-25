"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { DashboardHero } from "@/components/dashboard/hero";
import { SplitOverlay } from "@/components/split/split-overlay";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Split } from "lucide-react";

interface DashboardClientProps {
    safeToSpend: number;
    lockedPotsTotal: number;
    activeGoal: any;
    recentExpenses: any[];
    totalBalance: number;
    formatCurrency: (amount: number) => string;
}

export function DashboardClient({
    safeToSpend,
    lockedPotsTotal,
    activeGoal,
    recentExpenses,
    totalBalance,
    formatCurrency,
}: DashboardClientProps) {
    const router = useRouter();
    const [splitOverlayOpen, setSplitOverlayOpen] = useState(false);
    const [selectedSplitTransaction, setSelectedSplitTransaction] = useState<{ id: string; amount: number } | null>(null);

    const handleOpenSplit = (tx: any) => {
        setSelectedSplitTransaction({ id: tx.id, amount: Number(tx.amount) });
        setSplitOverlayOpen(true);
    };

    return (
        <div className="space-y-8 pb-20">
            <section className="space-y-2 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-zinc-400">Overview</p>
                </div>
                <button
                    onClick={() => router.push('/transfer')}
                    className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                    <ArrowLeftRight className="w-4 h-4" />
                    Transfer
                </button>
            </section>

            <DashboardHero safeToSpend={safeToSpend} />

            <BentoGrid>
                {/* Locked Pots Card */}
                <DashboardCard title="Locked Pots (Bills)">
                    <div className="flex flex-col h-full justify-between">
                        <p className="text-2xl font-bold text-white mb-2">{formatCurrency(lockedPotsTotal)}</p>
                        <div className="mt-auto">
                            <ProgressBar value={75} colorClass="bg-amber-400" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Reserved for bills & goals</p>
                    </div>
                </DashboardCard>

                {/* Active Goal Card */}
                <DashboardCard title={activeGoal ? `Active Goal: ${activeGoal.title}` : "Active Goal"}>
                    <div className="flex flex-col h-full justify-between">
                        {activeGoal ? (
                            <>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-2xl font-bold text-white">$0</span>
                                    <span className="text-sm text-zinc-400">/ {formatCurrency(activeGoal.target_amount)}</span>
                                </div>
                                <div className="mt-auto">
                                    {/* Mock progress 0 for now */}
                                    <ProgressBar value={0} colorClass="bg-emerald-400" />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500">
                                No active goals
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* Recent Expenses Card */}
                <DashboardCard title="Recent Expenses" className="md:col-span-1 lg:col-span-1">
                    <div className="space-y-3 mt-2">
                        {recentExpenses.length > 0 ? (
                            recentExpenses.map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 group/row">
                                    <span className="text-zinc-300 truncate max-w-[120px]">{tx.description || "Expense"}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-mono">{formatCurrency(Number(tx.amount))}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenSplit(tx); }}
                                            className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-zinc-700 hover:text-white"
                                        >
                                            Split
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-zinc-500 text-sm">No recent expenses</p>
                        )}
                    </div>
                </DashboardCard>

                {/* Total Balance Card */}
                <DashboardCard title="Total Balance">
                    <div className="flex flex-col h-full justify-center">
                        <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                            {formatCurrency(totalBalance)}
                        </p>
                        <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
                            Total Available
                        </p>
                    </div>
                </DashboardCard>

            </BentoGrid>

            {selectedSplitTransaction && (
                <SplitOverlay
                    isOpen={splitOverlayOpen}
                    onClose={() => setSplitOverlayOpen(false)}
                    transactionAmount={selectedSplitTransaction.amount}
                    transactionId={selectedSplitTransaction.id}
                />
            )}
        </div>
    );
}
