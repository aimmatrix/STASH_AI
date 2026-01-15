"use client"

import { formatDistanceToNow } from 'date-fns'

interface Expense {
    id: string
    merchant_name: string
    amount: number
    date: string
    category: string
}

interface RecentExpensesProps {
    expenses: Expense[]
    currency: string
    loading?: boolean
}

export function RecentExpenses({ expenses, currency, loading }: RecentExpensesProps) {
    if (loading) {
        return (
            <div className="w-full space-y-4">
                <h3 className="font-semibold text-lg">Recent Activity</h3>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30">
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="w-full space-y-4">
            <h3 className="font-semibold text-lg text-foreground/80">Recent Activity</h3>

            {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent expenses
                </div>
            ) : (
                <div className="space-y-2">
                    {expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-colors"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{expense.merchant_name}</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                    {expense.category} • {new Date(expense.date).toLocaleDateString()}
                                </span>
                            </div>
                            <span className="font-semibold text-sm">
                                {new Intl.NumberFormat('en-GB', {
                                    style: 'currency',
                                    currency: currency
                                }).format(expense.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
