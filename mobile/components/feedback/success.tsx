
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withSpring,
    withDelay,
    withSequence
} from "react-native-reanimated";
import { Svg, Circle, Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function PaymentSuccess() {
    // Simple version using Feather icon scaling for robustness
    // Complex SVG path animation can be brittle without lottie
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSequence(
            withSpring(1.2),
            withSpring(1)
        );
    }, []);

    const animatedStyle = {
        transform: [{ scale: scale }]
    } as any;

    return (
        <View className="items-center justify-center space-y-4">
            <Animated.View
                style={animatedStyle}
                className="w-24 h-24 bg-emerald-500 rounded-full items-center justify-center shadow-lg shadow-emerald-500/50"
            >
                <Feather name="check" size={48} color="black" />
            </Animated.View>
            <Text className="text-white text-xl font-bold tracking-tight">Success!</Text>
        </View>
    );
}
