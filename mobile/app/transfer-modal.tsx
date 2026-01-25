
import React, { useState } from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Keypad } from "@/components/transfer/keypad";
import { PaymentSuccess } from "@/components/feedback/success";
import { Feather } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

export default function TransferModal() {
    const router = useRouter();
    const [amount, setAmount] = useState("0");
    const [isDepositing, setIsDepositing] = useState(true);
    const [success, setSuccess] = useState(false);

    const handleKeyPress = (key: string) => {
        if (amount === "0" && key !== ".") {
            setAmount(key);
        } else {
            if (key === "." && amount.includes(".")) return;
            if (amount.replace(".", "").length >= 6) return;
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

    const handleConfirm = () => {
        // Mock API call
        setSuccess(true);
        setTimeout(() => {
            router.back();
        }, 1500);
    };

    if (success) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <PaymentSuccess />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

            {/* Header */}
            <View className="flex-row justify-between items-center p-4">
                <Pressable onPress={() => router.back()}>
                    <Text className="text-zinc-400 font-medium">Cancel</Text>
                </Pressable>
                <Text className="text-white font-bold text-lg">Transfer</Text>
                <View className="w-10" />
            </View>

            {/* Toggle */}
            <View className="items-center mt-6">
                <View className="flex-row items-center bg-zinc-900 rounded-full p-1">
                    <Pressable
                        onPress={() => setIsDepositing(true)}
                        className={cn("px-6 py-2 rounded-full", isDepositing ? "bg-emerald-500" : "bg-transparent")}
                    >
                        <Text className={cn("font-medium", isDepositing ? "text-black" : "text-zinc-500")}>To Pot</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setIsDepositing(false)}
                        className={cn("px-6 py-2 rounded-full", !isDepositing ? "bg-emerald-500" : "bg-transparent")}
                    >
                        <Text className={cn("font-medium", !isDepositing ? "text-black" : "text-zinc-500")}>From Pot</Text>
                    </Pressable>
                </View>
            </View>

            {/* Amount */}
            <View className="flex-1 items-center justify-center mb-8 gap-2">
                <Text className="text-zinc-500 text-sm uppercase tracking-widest">Amount</Text>
                <Text className="text-7xl font-bold text-white tracking-tighter">${amount}</Text>
            </View>

            {/* Keypad */}
            <View className="items-center pb-8">
                <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} />

                <Pressable
                    onPress={handleConfirm}
                    disabled={parseFloat(amount) <= 0}
                    className={cn(
                        "w-full max-w-[280px] h-14 rounded-full items-center justify-center mt-4 transition-all",
                        parseFloat(amount) > 0 ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                >
                    <Text className={cn("text-lg font-bold", parseFloat(amount) > 0 ? "text-black" : "text-zinc-500")}>
                        Confirm
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
