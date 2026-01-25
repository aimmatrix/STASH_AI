
import React from "react";
import { Pressable, Text, View, PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface DashboardCardProps extends PressableProps {
    title?: string;
    children: React.ReactNode;
    className?: string; // NativeWind className
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DashboardCard({ title, children, className, onPress, ...props }: DashboardCardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = (event: any) => {
        Haptics.selectionAsync();
        if (onPress) onPress(event);
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className={cn("bg-card border border-white/5 rounded-2xl p-4 overflow-hidden", className)}
            {...props}
        >
            {title && <Text className="text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">{title}</Text>}
            <View className="flex-1">{children}</View>
        </AnimatedPressable>
    );
}
