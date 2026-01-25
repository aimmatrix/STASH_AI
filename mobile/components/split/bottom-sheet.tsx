
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { PaymentSuccess } from '@/components/feedback/success';
import { cn } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';

interface SplitBottomSheetProps {
    transaction: any;
    onClose: () => void;
}

const MOCK_FRIENDS = [
    { id: '1', name: 'Alice', initial: 'A' },
    { id: '2', name: 'Bob', initial: 'B' },
    { id: '3', name: 'Charlie', initial: 'C' },
];

export const SplitBottomSheet = React.forwardRef<BottomSheet, SplitBottomSheetProps>(({ transaction, onClose }, ref) => {
    const snapPoints = useMemo(() => ['50%'], []);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    // renders
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.8}
                enableTouchThrough={false}
            />
        ),
        []
    );

    const toggleFriend = (id: string) => {
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter(fid => fid !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    }

    const handleSplit = () => {
        setSuccess(true);
        setTimeout(() => {
            onClose();
            setSuccess(false);
            setSelectedFriends([]);
        }, 1500);
    }

    const amount = transaction ? Math.abs(transaction.amount) : 0;
    const splitAmount = amount / (selectedFriends.length + 1);

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            onClose={onClose}
            backgroundStyle={{ backgroundColor: '#121212' }}
            handleIndicatorStyle={{ backgroundColor: '#3f3f46' }}
        >
            <BottomSheetView className="flex-1 p-6 items-center">
                {success ? (
                    <PaymentSuccess />
                ) : (
                    <>
                        <View className="w-full flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Split & Request</Text>
                            <Pressable onPress={onClose}>
                                <Feather name="x" size={24} color="#71717a" />
                            </Pressable>
                        </View>

                        {transaction && (
                            <View className="mb-8 items-center">
                                <Text className="text-zinc-400 mb-1">Total Bill</Text>
                                <Text className="text-4xl font-bold text-white">${amount.toFixed(2)}</Text>
                            </View>
                        )}

                        <Text className="text-zinc-500 text-xs uppercase tracking-widest mb-4 w-full">Select Friends</Text>

                        <View className="flex-row gap-4 mb-8">
                            {MOCK_FRIENDS.map(friend => {
                                const isSelected = selectedFriends.includes(friend.id);
                                return (
                                    <Pressable
                                        key={friend.id}
                                        onPress={() => toggleFriend(friend.id)}
                                        className="items-center gap-2"
                                    >
                                        <View className={cn(
                                            "w-14 h-14 rounded-full items-center justify-center border-2",
                                            isSelected ? "bg-emerald-500 border-emerald-500" : "bg-zinc-800 border-transparent"
                                        )}>
                                            <Text className={cn("font-bold text-lg", isSelected ? "text-black" : "text-white")}>{friend.initial}</Text>
                                        </View>
                                        <Text className={cn("text-xs font-medium", isSelected ? "text-emerald-500" : "text-zinc-500")}>{friend.name}</Text>
                                    </Pressable>
                                )
                            })}
                        </View>

                        <View className="w-full bg-zinc-900 p-4 rounded-xl mb-6 flex-row justify-between items-center">
                            <Text className="text-zinc-400">Total per person</Text>
                            <Text className="text-white font-bold text-lg">${splitAmount.toFixed(2)}</Text>
                        </View>

                        <Pressable
                            onPress={handleSplit}
                            disabled={selectedFriends.length === 0}
                            className={cn(
                                "w-full h-14 rounded-full items-center justify-center",
                                selectedFriends.length > 0 ? "bg-emerald-500" : "bg-zinc-800"
                            )}
                        >
                            <Text className={cn("font-bold text-lg", selectedFriends.length > 0 ? "text-black" : "text-zinc-500")}>
                                Send Request
                            </Text>
                        </Pressable>
                    </>
                )}
            </BottomSheetView>
        </BottomSheet>
    );
});
