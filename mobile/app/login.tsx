import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        else if (!isSignUp) Alert.alert('Success', 'Please check your inbox for email verification!');
        setLoading(false);
    }

    const handleAuth = () => {
        if (isSignUp) signUpWithEmail();
        else signInWithEmail();
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <View className="p-8 space-y-8">
                        {/* Logo Section */}
                        <View className="items-center mb-10">
                            <Text className="text-emerald-500 font-bold text-5xl tracking-tighter mb-2">stash</Text>
                            <Text className="text-zinc-500 text-sm tracking-widest uppercase">Financial Co-Pilot</Text>
                        </View>

                        {/* Form Section */}
                        <View className="space-y-4">
                            <View className="space-y-2">
                                <Text className="text-zinc-400 text-xs ml-1 uppercase font-bold">Email</Text>
                                <TextInput
                                    onChangeText={setEmail}
                                    value={email}
                                    placeholder="hello@example.com"
                                    placeholderTextColor="#52525b"
                                    autoCapitalize="none"
                                    className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl text-lg font-medium"
                                />
                            </View>

                            <View className="space-y-2">
                                <Text className="text-zinc-400 text-xs ml-1 uppercase font-bold">Password</Text>
                                <TextInput
                                    onChangeText={setPassword}
                                    value={password}
                                    placeholder="••••••••"
                                    placeholderTextColor="#52525b"
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl text-lg font-medium"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleAuth}
                                disabled={loading}
                                className="bg-emerald-500 p-4 rounded-xl items-center mt-4 active:bg-emerald-600"
                            >
                                <Text className="text-black font-bold text-lg">
                                    {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} className="items-center mt-4">
                                <Text className="text-zinc-500">
                                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                    <Text className="text-emerald-500 font-bold">
                                        {isSignUp ? 'Sign In' : 'Sign Up'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-zinc-800" />
                            <Text className="mx-4 text-zinc-600 text-xs">OR CONTINUE WITH</Text>
                            <View className="flex-1 h-px bg-zinc-800" />
                        </View>

                        {/* Social Login Section */}
                        <View className="flex-row gap-4">
                            <TouchableOpacity className="flex-1 bg-white p-4 rounded-xl flex-row items-center justify-center gap-2">
                                <Ionicons name="logo-google" size={20} color="black" />
                                <Text className="text-black font-bold">Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-zinc-800 p-4 rounded-xl flex-row items-center justify-center gap-2">
                                <Ionicons name="logo-apple" size={20} color="white" />
                                <Text className="text-white font-bold">Apple</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
