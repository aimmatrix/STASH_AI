

import { View, Text, ScrollView, SafeAreaView, RefreshControl, Pressable } from "react-native";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import { DashboardHero } from "@/components/dashboard/hero";
import { DashboardCard } from "@/components/dashboard/card";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { calculateSafeToSpend } from "@/lib/dashboard-logic";
import { Feather } from "@expo/vector-icons";
import BottomSheet, { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SplitBottomSheet } from "@/components/split/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function DashboardScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [lockedPotsTotal, setLockedPotsTotal] = useState(0);
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [recentExpense, setRecentExpense] = useState<any>(null);

  const fetchData = async () => {
    try {
      // Fetch latest data
      const [transactionsRes, potsRes, goalsRes] = await Promise.all([
        supabase.from("transactions").select("*"),
        supabase.from("pots").select("*"),
        supabase.from("goals").select("*").limit(1),
      ]);

      const transactions = transactionsRes.data || [];
      const pots = potsRes.data || [];
      const goals = goalsRes.data || [];

      // Calculations
      const bal = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const locked = pots.reduce((sum, pot) => sum + Number(pot.current_amount), 0);
      const safe = calculateSafeToSpend(bal, locked);

      // Recent Expense
      const expense = transactions
        .filter((tx) => Number(tx.amount) < 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      setTotalBalance(bal);
      setLockedPotsTotal(locked);
      setSafeToSpend(safe);
      setActiveGoal(goals[0]);
      setRecentExpense(expense);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleSplit = () => {
    bottomSheetRef.current?.expand();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        >
          <View className="flex-row justify-end px-4 pt-2">
            <Pressable
              onPress={() => router.push('/transfer-modal')}
              className="bg-zinc-900 px-4 py-2 rounded-full flex-row items-center gap-2 active:bg-zinc-800"
            >
              <Feather name="repeat" size={14} color="#10B981" />
              <Text className="text-emerald-500 text-xs font-bold uppercase">Transfer</Text>
            </Pressable>
          </View>

          <DashboardHero safeToSpend={safeToSpend} />

          <View className="p-4 gap-4">
            {/* Row 1 */}
            <View className="flex-row gap-4">
              <DashboardCard title="Locked Pots" className="flex-1 h-40">
                <View className="flex-1 justify-between">
                  <Text className="text-2xl font-bold text-white">{formatCurrency(lockedPotsTotal)}</Text>
                  <View>
                    <ProgressBar value={75} colorClass="bg-amber-400" />
                    <Text className="text-zinc-500 text-[10px] mt-2">Reserved for Bills</Text>
                  </View>
                </View>
              </DashboardCard>

              <DashboardCard title={activeGoal ? "Active Goal" : "Goal"} className="flex-1 h-40">
                <View className="flex-1 justify-between">
                  {activeGoal ? (
                    <>
                      <Text className="text-white text-lg font-bold truncate" numberOfLines={1}>{activeGoal.title}</Text>
                      <View>
                        <View className="flex-row justify-between items-end mb-1">
                          <Text className="text-white font-bold">$0</Text>
                          <Text className="text-zinc-500 text-[10px]">{formatCurrency(activeGoal.target_amount)}</Text>
                        </View>
                        <ProgressBar value={10} colorClass="bg-emerald-500" />
                      </View>
                    </>
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-zinc-500 text-xs">No active goal</Text>
                    </View>
                  )}
                </View>
              </DashboardCard>
            </View>

            {/* Row 2 */}
            <View className="flex-row gap-4">
              <DashboardCard title="Recent Activity" className="flex-1 h-40" onPress={handleSplit}>
                {recentExpense ? (
                  <View className="flex-1 justify-center space-y-1">
                    <Text className="text-white font-medium" numberOfLines={1}>{recentExpense.description || "Expense"}</Text>
                    <Text className="text-zinc-400 text-xs">{new Date(recentExpense.date).toLocaleDateString()}</Text>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-emerald-400 font-mono text-lg">{formatCurrency(Number(recentExpense.amount))}</Text>
                      <View className="bg-zinc-800 px-2 py-1 rounded">
                        <Text className="text-[10px] text-zinc-400">Split</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-zinc-500 text-xs">No activity</Text>
                  </View>
                )}
              </DashboardCard>

              <DashboardCard title="Wallet" className="flex-1 h-40">
                <View className="flex-1 justify-center items-center">
                  <Feather name="credit-card" size={24} color="#10B981" style={{ marginBottom: 8 }} />
                  <Text className="text-white font-bold text-xl">{formatCurrency(totalBalance)}</Text>
                  <Text className="text-zinc-500 text-[10px]">Total Available</Text>
                </View>
              </DashboardCard>
            </View>

          </View>
        </ScrollView>
        <SplitBottomSheet
          ref={bottomSheetRef}
          transaction={recentExpense}
          onClose={() => bottomSheetRef.current?.close()}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
