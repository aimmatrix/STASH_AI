import { View, Text, SafeAreaView } from 'react-native';

export default function ChatScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-white text-xl font-bold">Stash Assistant</Text>
            </View>
        </SafeAreaView>
    );
}
