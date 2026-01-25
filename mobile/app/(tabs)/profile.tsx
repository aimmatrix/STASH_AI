import { View, Text, SafeAreaView } from 'react-native';

export default function ProfileScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-white text-xl font-bold">User Profile</Text>
            </View>
        </SafeAreaView>
    );
}
