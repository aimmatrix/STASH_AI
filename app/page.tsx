import { createClient } from "@/lib/supabase/server";
import { calculateSafeToSpend } from "@/lib/dashboard-logic";
import { DashboardClient } from "./dashboard-client";

export default async function Home() {
  const supabase = await createClient();

  // Parallel data fetching
  const [transactionsRes, potsRes, goalsRes] = await Promise.all([
    supabase.from("transactions").select("*"),
    supabase.from("pots").select("*"),
    supabase.from("goals").select("*").limit(1), // Just one active goal for now
  ]);

  const transactions = transactionsRes.data || [];
  const pots = potsRes.data || [];
  const goals = goalsRes.data || [];

  // Calculations
  const totalBalance = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const lockedPotsTotal = pots.reduce((sum, pot) => sum + Number(pot.current_amount), 0);
  const safeToSpend = calculateSafeToSpend(totalBalance, lockedPotsTotal);

  // Recent Expenses (last 5 negative transactions)
  const recentExpenses = transactions
    .filter((tx) => Number(tx.amount) < 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const activeGoal = goals[0];

  // Need to pass a serialize-able formatCurrency or just pass string values?
  // Better to pass raw values and helper is internal to client component or re-created there.
  // Passing a function directly from Server Component to Client Component is not allowed.
  // I will move formatCurrency inside DashboardClient.

  return (
    <DashboardClient
      safeToSpend={safeToSpend}
      lockedPotsTotal={lockedPotsTotal}
      activeGoal={activeGoal}
      recentExpenses={recentExpenses}
      totalBalance={totalBalance}
      formatCurrency={(amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
      }
    />
  );
}
