"use client"

interface BudgetProgressProps {
    spent: number
    total: number
    currency: string
    loading?: boolean
}

export function BudgetProgress({ spent, total, currency, loading }: BudgetProgressProps) {
    const percentage = Math.min(Math.max((spent / total) * 100, 0), 100) || 0

    if (loading) {
        return (
            <div className="w-full space-y-4 p-4 rounded-xl border border-border bg-card">
                <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-3 w-full bg-muted animate-pulse rounded-full" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-3 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Monthly Budget</span>
                <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: currency,
                        maximumFractionDigits: 0
                    }).format(spent)} / {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: currency,
                        maximumFractionDigits: 0
                    }).format(total)}
                </span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
