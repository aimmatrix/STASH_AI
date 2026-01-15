"use client"

interface SafeSpendCardProps {
    amount: number
    currency: string
    loading?: boolean
}

export function SafeSpendCard({ amount, currency, loading }: SafeSpendCardProps) {
    return (
        <div className="w-full rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 p-6 border border-accent/20 shadow-sm flex flex-col items-center justify-center space-y-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Safe to Spend
            </span>
            {loading ? (
                <div className="h-12 w-32 bg-accent/10 animate-pulse rounded" />
            ) : (
                <h2 className="text-5xl font-bold tracking-tighter text-foreground">
                    {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: currency,
                        maximumFractionDigits: 0
                    }).format(amount)}
                </h2>
            )}
            <span className="text-xs text-muted-foreground">
                Available relative to your budget
            </span>
        </div>
    )
}
