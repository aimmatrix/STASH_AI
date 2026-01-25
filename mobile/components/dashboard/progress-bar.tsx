
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from "react-native-reanimated";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number; // 0 to 100
    className?: string;
    colorClass?: string; // Tailwind color class e.g. "bg-emerald-500"
}

export function ProgressBar({ value, className, colorClass = "bg-primary" }: ProgressBarProps) {
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withDelay(300, withTiming(value, { duration: 1000 }));
    }, [value]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
    }));

    return (
        <View className={cn("w-full bg-white/10 h-2 rounded-full overflow-hidden", className)}>
            <Animated.View className={cn("h-full", colorClass)} style={animatedStyle} />
        </View>
    );
}
