
import { View, Text } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

interface DashboardHeroProps {
    safeToSpend: number;
}

export function DashboardHero({ safeToSpend }: DashboardHeroProps) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(safeToSpend);

    return (
        <View className="items-center justify-center py-12 space-y-2">
            <Text className="text-zinc-500 text-xs font-medium uppercase tracking-widest text-center">
                Safe to Spend Today
            </Text>
            <Animated.Text
                entering={ZoomIn.duration(500).springify()}
                className="text-6xl font-bold text-emerald-500 tracking-tighter text-center"
            >
                {formatted}
            </Animated.Text>
        </View>
    );
}
