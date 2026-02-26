import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Info, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { simulatePurchase } from '../lib/simulator';

// Types for the simulation result
interface SimulationResult {
    is_affordable: boolean;
    affordability_status: 'yes' | 'yes_but' | 'no';
    impact_summary: string[];
    ai_whisper: string;
}

export function SimulationScreen() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [loadingText, setLoadingText] = useState('Checking obligations...');
    const [result, setResult] = useState<SimulationResult | null>(null);

    const animationTexts = [
        'Checking obligations...',
        'Calculating pot impacts...',
        'Peering into the future...',
        'Synthesizing insights...',
    ];

    // Cycle loading text
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isSimulating) {
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % animationTexts.length;
                setLoadingText(animationTexts[i]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isSimulating]);

    const handleSimulate = async () => {
        if (!query.trim() || !user) return;

        Keyboard.dismiss();
        setIsSimulating(true);
        setResult(null);

        try {
            const raw = await simulatePurchase(user.id, query);

            // Derive the affordability_status from the ai_whisper prefix
            const whisper = raw.ai_whisper.toLowerCase();
            const affordability_status: 'yes' | 'yes_but' | 'no' =
                whisper.startsWith('no') ? 'no'
                : whisper.startsWith('yes, but') || whisper.startsWith('yes but') ? 'yes_but'
                : 'yes';

            setResult({
                is_affordable: raw.is_affordable,
                affordability_status,
                impact_summary: [raw.impact_summary],
                ai_whisper: raw.ai_whisper,
            });
        } catch {
            setResult({
                is_affordable: false,
                affordability_status: 'no',
                impact_summary: ['Unable to run simulation at this time.'],
                ai_whisper: 'Something went sideways. Your wallet is safe for now.',
            });
        } finally {
            setIsSimulating(false);
        }
    };

    const handleCreateSinkingFund = () => {
        // Here you would trigger navigation to create a new Pot or open a modal
        console.log('Open Pot Creation Modal for:', query);
    };

    const resetSimulation = () => {
        setResult(null);
        setQuery('');
    };

    const getStatusColor = (status: 'yes' | 'yes_but' | 'no') => {
        switch (status) {
            case 'yes': return '#10B981'; // Emerald
            case 'yes_but': return '#F59E0B'; // Amber
            case 'no': return '#EF4444'; // Crimson
            default: return '#10B981';
        }
    };

    const getStatusTitle = (status: 'yes' | 'yes_but' | 'no') => {
        switch (status) {
            case 'yes': return 'Yes, definitely.';
            case 'yes_but': return 'Yes, but be careful.';
            case 'no': return 'No, not recommended.';
            default: return 'Analysis Complete';
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Time Travel Simulator 🔮</Text>
                    <Text style={styles.subtitle}>Ask Stash AI how future purchases impact your budget</Text>
                </View>

                {/* Loading State */}
                {isSimulating && (
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={styles.loadingContainer}
                    >
                        {/* Simple Skeleton Loader Blocks */}
                        <View style={styles.skeletonHeader} />
                        <View style={styles.skeletonLineItem} />
                        <View style={styles.skeletonLineItem} />
                        <View style={[styles.skeletonLineItem, { width: '60%' }]} />

                        <View style={styles.loadingTextContainer}>
                            <ActivityIndicator color="#10B981" />
                            <Text style={styles.loadingText}>{loadingText}</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Results Card */}
                {result && !isSimulating && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.resultsContainer}>
                        {/* Status Header */}
                        <View style={[
                            styles.resultHeader,
                            { borderLeftColor: getStatusColor(result.affordability_status) }
                        ]}>
                            <Text style={[
                                styles.resultTitle,
                                { color: getStatusColor(result.affordability_status) }
                            ]}>
                                {getStatusTitle(result.affordability_status)}
                            </Text>
                        </View>

                        {/* Impact Summary */}
                        <View style={styles.summaryContainer}>
                            <Text style={styles.sectionTitle}>Expected Impact:</Text>
                            {result.impact_summary.map((point, index) => (
                                <View key={index} style={styles.bulletRow}>
                                    <View style={styles.bulletPoint} />
                                    <Text style={styles.bulletText}>{point}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Stash AI Advice Callout */}
                        <View style={styles.glowWrapper}>
                            <LinearGradient
                                colors={['rgba(16, 185, 129, 0.15)', 'transparent']}
                                style={styles.aiCalloutBackground}
                            />
                            <View style={styles.aiCalloutContent}>
                                <View style={styles.aiHeader}>
                                    <Info size={16} color="#10B981" />
                                    <Text style={styles.aiHeaderTitle}>Stash AI Advice</Text>
                                </View>
                                <Text style={styles.aiAdviceText}>{result.ai_whisper}</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionsContainer}>
                            <Pressable
                                style={styles.primaryActionBtn}
                                onPress={handleCreateSinkingFund}
                            >
                                <Plus size={18} color="#000000" />
                                <Text style={styles.primaryActionText}>Create a Sinking Fund for this</Text>
                            </Pressable>

                            <Pressable
                                style={styles.secondaryActionBtn}
                                onPress={resetSimulation}
                            >
                                <Text style={styles.secondaryActionText}>Ask another question</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                )}

            </ScrollView>

            {/* Input Area anchored to bottom */}
            {!result && (
                <View style={[
                    styles.inputContainer,
                    isSimulating && styles.inputContainerDisabled
                ]}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="What are you planning to buy? (e.g. £1,200 MacBook in Oct)"
                        placeholderTextColor="#666666"
                        value={query}
                        onChangeText={setQuery}
                        multiline
                        maxLength={150}
                        editable={!isSimulating}
                        onSubmitEditing={handleSimulate}
                    />
                    <Pressable
                        style={[
                            styles.sendButton,
                            (!query.trim() || isSimulating) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSimulate}
                        disabled={!query.trim() || isSimulating}
                    >
                        <ArrowRight size={20} color={query.trim() && !isSimulating ? "#000000" : "#666666"} />
                    </Pressable>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120, // space for fixed input
        flexGrow: 1,
    },
    header: {
        marginTop: Platform.OS === 'ios' ? 20 : 0,
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888888',
        fontFamily: 'Inter_400Regular',
    },
    // Loading State
    loadingContainer: {
        flex: 1,
        marginTop: 40,
        gap: 16,
    },
    skeletonHeader: {
        height: 32,
        width: '40%',
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        marginBottom: 16,
    },
    skeletonLineItem: {
        height: 16,
        width: '100%',
        backgroundColor: '#1A1A1A',
        borderRadius: 4,
    },
    loadingTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        gap: 12,
    },
    loadingText: {
        color: '#10B981',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        fontWeight: '600',
    },
    // Results
    resultsContainer: {
        flex: 1,
        marginTop: 16,
    },
    resultHeader: {
        borderLeftWidth: 4,
        paddingLeft: 16,
        marginBottom: 24,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    summaryContainer: {
        marginBottom: 24,
        backgroundColor: '#121212',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 16,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginTop: 6,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: '#E2E8F0',
        lineHeight: 20,
        fontFamily: 'Inter_400Regular',
    },
    // AI Callout
    glowWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: '#0A1A14', // very dark green
        marginBottom: 32,

        // Glow effect
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    aiCalloutBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    aiCalloutContent: {
        padding: 20,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    aiHeaderTitle: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'Inter_700Bold',
    },
    aiAdviceText: {
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 22,
        fontFamily: 'Inter_400Regular',
    },
    // Actions
    actionsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    primaryActionBtn: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        gap: 8,
    },
    primaryActionText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    secondaryActionBtn: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333333',
    },
    secondaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    // Input Area
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#121212',
        borderTopWidth: 1,
        borderTopColor: '#222222',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    inputContainerDisabled: {
        opacity: 0.5,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#000000',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        color: '#FFFFFF',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#333333',
        maxHeight: 100,
        fontFamily: 'Inter_400Regular',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#222222',
    }
});
