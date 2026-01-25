
import React from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface KeypadProps {
    onKeyPress: (key: string) => void;
    onDelete: () => void;
}

export function Keypad({ onKeyPress, onDelete }: KeypadProps) {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

    const handlePress = (key: string) => {
        Haptics.selectionAsync();
        onKeyPress(key);
    };

    const handleDelete = () => {
        Haptics.selectionAsync();
        onDelete();
    };

    return (
        <View className="flex-row flex-wrap justify-center w-full max-w-[280px]">
            {keys.map((key) => (
                <Pressable
                    key={key}
                    onPress={() => handlePress(key)}
                    className={cn(
                        "w-[30%] h-20 items-center justify-center m-1 rounded-full active:bg-white/10"
                    )}
                >
                    <Text className="text-3xl text-white font-medium">{key}</Text>
                </Pressable>
            ))}
            <Pressable
                onPress={handleDelete}
                className="w-[30%] h-20 items-center justify-center m-1 rounded-full active:bg-white/10"
            >
                <Feather name="delete" size={24} color="white" />
            </Pressable>
        </View>
    );
}
