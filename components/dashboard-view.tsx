"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { SafeSpendCard } from './safe-spend-card'
import { BudgetProgress } from './budget-progress'
import { RecentExpenses } from './recent-expenses'
import { Database } from '@/types'
import { haptic } from '@/utils/haptics'
import { Plus } from 'lucide-react'

type Expense = Database['public']['Tables']['expenses']['Row']

export function DashboardView() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [currency, setCurrency] = useState('GBP')
    const [monthlyAmount, setMonthlyAmount] = useState(0) // From income_settings
    const [totalSpent, setTotalSpent] = useState(0) // From expenses this month
    const [cashAvailable, setCashAvailable] = useState(0) // From accounts
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()

            // If no user, mock data for dashboard preview (since we don't have auth flow yet)
            // Remove this when auth is fully implemented to force login
            const isMock = !user

            if (isMock) {
                // MOCK DATA for verification
                setMonthlyAmount(3500)
                setCurrency('GBP')
                setCashAvailable(1200) // Checking + Savings
                setTotalSpent(2450)
                setRecentExpenses([
                    { id: '1', user_id: 'mock', amount: 45.99, category: 'groceries', merchant_name: 'Tesco', date: new Date().toISOString() },
                    { id: '2', user_id: 'mock', amount: 12.50, category: 'transport', merchant_name: 'Uber', date: new Date().toISOString() },
                    { id: '3', user_id: 'mock', amount: 120.00, category: 'bills', merchant_name: 'Electric Co', date: new Date().toISOString() },
                ])
                setLoading(false)
                return
            }

            const userId = user?.id
            if (!userId) return

            // 1. Fetch Income Settings
            const { data: incomeData } = await supabase
                .from('income_settings')
                .select('*')
                .eq('user_id', userId)
                .single<Database['public']['Tables']['income_settings']['Row']>()

            if (incomeData) {
                setMonthlyAmount(incomeData.monthly_amount)
                setCurrency(incomeData.currency || 'GBP')
            }

            // 2. Fetch Accounts (Calculated Cash Available)
            const { data: accountsData } = await supabase
                .from('accounts')
                .select('balance, include_in_available')
                .eq('user_id', userId)
                .returns<Database['public']['Tables']['accounts']['Row'][]>()

            if (accountsData) {
                const available = accountsData
                    .filter(acc => acc.include_in_available)
                    .reduce((sum, acc) => sum + Number(acc.balance), 0)
                setCashAvailable(available)
            }

            // 3. Fetch Expenses (This Month)
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userId)
                .gte('date', firstDay)
                .lte('date', lastDay)
                .order('date', { ascending: false })
                .returns<Database['public']['Tables']['expenses']['Row'][]>()

            if (expensesData) {
                const spent = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0)
                setTotalSpent(spent)
                setRecentExpenses(expensesData.slice(0, 3))
            }

            setLoading(false)
        }

        fetchData()
    }, [])

    // Math Logic: Safe to Spend = Min((Income - Spent), Cash Available)
    const remainingBudget = Math.max(0, monthlyAmount - totalSpent)
    // If cash available is less than remaining budget, you are cash constrained.
    const safeToSpend = Math.min(remainingBudget, cashAvailable)

    return (
        <div className="flex flex-col space-y-8 px-4 py-6 w-full max-w-md mx-auto">
            <section>
                <SafeSpendCard
                    amount={safeToSpend}
                    currency={currency}
                    loading={loading}
                />
            </section>

            <section>
                <BudgetProgress
                    spent={totalSpent}
                    total={monthlyAmount}
                    currency={currency}
                    loading={loading}
                />
            </section>

            <section>
                <RecentExpenses
                    expenses={recentExpenses}
                    currency={currency}
                    loading={loading}
                />
            </section>

            {/* Floating Action Button (FAB) for Haptic Demo */}
            <button
                onClick={() => {
                    haptic.success()
                    // In a real app, this would open an 'Add Expense' modal
                    console.log("FAB Clicked - Haptic Triggered")
                }}
                className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-accent text-primary-foreground shadow-lg flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all"
                aria-label="Add Expense"
            >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
        </div>
    )
}
