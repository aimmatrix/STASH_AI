import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import { Check, Edit2, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export interface UnverifiedTransaction {
    id: string;
    name: string;
    amount: number;
    category?: string;
    is_verified: boolean;
}

interface Category {
    id: string;
    name: string;
}

export const ReviewQueue = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<UnverifiedTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    // Bottom sheet refs
    const categorySheetRef = useRef<BottomSheet>(null);
    const ruleSheetRef = useRef<BottomSheet>(null);

    const [selectedTransaction, setSelectedTransaction] = useState<UnverifiedTransaction | null>(null);

    // Rule creation state
    const [rulePattern, setRulePattern] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [savingRule, setSavingRule] = useState(false);

    // Reanimated Shared Values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const flashOpacity = useSharedValue(0);

    useEffect(() => {
        fetchUnverified();
        fetchCategories();
    }, [user]);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('id, name')
            .order('name', { ascending: true });
        if (data) setCategories(data);
    };

    const fetchUnverified = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_verified', false)
                .order('date', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                setTransactions([
                    { id: 'm1', name: 'AMZN-19283', amount: 42.99, category: 'Shopping', is_verified: false },
                    { id: 'm2', name: 'UBER *EATS', amount: 24.50, category: 'Food & Drink', is_verified: false },
                    { id: 'm3', name: 'NETFLIX', amount: 15.99, category: 'Entertainment', is_verified: false },
                ]);
            } else {
                setTransactions(data);
            }
        } catch (err) {
            console.warn('Error fetching unverified transactions:', err);
            setTransactions([
                { id: 'm1', name: 'AMZN-19283', amount: 42.99, category: 'Shopping', is_verified: false },
                { id: 'm2', name: 'UBER *EATS', amount: 24.50, category: 'Food & Drink', is_verified: false },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const currentCard = transactions[0];

    const removeTopCard = () => {
        setTransactions((prev) => prev.slice(1));
        translateX.value = 0;
        translateY.value = 0;
        flashOpacity.value = 0;
    };

    const handleApprove = async (item: UnverifiedTransaction) => {
        flashOpacity.value = withTiming(1, { duration: 150 });
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
            runOnJS(removeTopCard)();
        });

        try {
            if (!item.id.startsWith('m')) {
                await supabase.from('transactions').update({ is_verified: true }).eq('id', item.id);
            }
        } catch (err) {
            console.warn('Failed to approve transaction', err);
        }
    };

    const handleEdit = (item: UnverifiedTransaction) => {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
            runOnJS(setSelectedTransaction)(item);
            runOnJS(openCategorySheet)();
        });
    };

    const handleCreateRule = (item: UnverifiedTransaction) => {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
            runOnJS(setSelectedTransaction)(item);
            runOnJS(openRuleSheet)(item.name);
        });
    };

    const openCategorySheet = () => {
        categorySheetRef.current?.expand();
    };

    const openRuleSheet = (prefillName: string) => {
        setRulePattern(prefillName);
        setSelectedCategoryId(null);
        ruleSheetRef.current?.expand();
    };

    const closeCategorySheetAndRemove = async (categoryName?: string) => {
        if (categoryName && selectedTransaction && !selectedTransaction.id.startsWith('m')) {
            await supabase
                .from('transactions')
                .update({ category: categoryName, is_verified: true })
                .eq('id', selectedTransaction.id);
        }
        categorySheetRef.current?.close();
        removeTopCard();
    };

    const closeRuleSheetAndRemove = () => {
        ruleSheetRef.current?.close();
        removeTopCard();
        setRulePattern('');
        setSelectedCategoryId(null);
    };

    const handleSaveRule = async () => {
        if (!user || !rulePattern.trim() || !selectedCategoryId) return;

        setSavingRule(true);
        try {
            const { error } = await supabase.from('transaction_rules').insert({
                user_id: user.id,
                match_pattern: rulePattern.trim(),
                target_category_id: selectedCategoryId,
                priority: 0,
                is_active: true,
            });

            if (error) {
                // Unique constraint violation means rule already exists — still dismiss
                if (error.code !== '23505') {
                    console.warn('Failed to save rule:', error.message);
                }
            }
        } catch (err) {
            console.warn('Save rule error:', err);
        } finally {
            setSavingRule(false);
            closeRuleSheetAndRemove();
        }
    };

    const panGesture = Gesture.Pan()
        .onChange((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (currentCard) {
                if (event.translationX > SWIPE_THRESHOLD) {
                    runOnJS(handleApprove)(currentCard);
                } else if (event.translationX < -SWIPE_THRESHOLD) {
                    runOnJS(handleEdit)(currentCard);
                } else if (event.translationY < -SWIPE_THRESHOLD) {
                    runOnJS(handleCreateRule)(currentCard);
                } else {
                    translateX.value = withSpring(0);
                    translateY.value = withSpring(0);
                }
            }
        });

    const animatedCardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            [-10, 0, 10],
            Extrapolation.CLAMP
        );
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
        backgroundColor: '#10B981',
    }));

    const swipeIndicatorsStyle = useAnimatedStyle(() => ({
        rightOpacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
        leftOpacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
        upOpacity: interpolate(translateY.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    }));

    const nextCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(Math.abs(translateX.value), [0, SCREEN_WIDTH], [0.9, 1], Extrapolation.CLAMP) }],
        opacity: transactions.length > 1 ? 1 : 0,
    }));

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator color="#10B981" size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Review Queue</Text>
            <Text style={styles.subtitle}>{transactions.length} items waiting</Text>

            <View style={styles.cardArea}>
                {transactions.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <LottieView
                            autoPlay
                            loop={false}
                            source={require('../assets/lottie/confetti.json')}
                            style={styles.lottie}
                        />
                        <Text style={styles.emptyStateTitle}>Inbox Zero!</Text>
                        <Text style={styles.emptyStateSubtitle}>Your budget is perfectly balanced.</Text>
                    </View>
                ) : (
                    <View style={styles.stackContainer}>
                        {transactions.length > 1 && (
                            <Animated.View style={[styles.card, styles.nextCard, nextCardStyle]}>
                                <Text style={styles.merchantName}>{transactions[1].name}</Text>
                                <Text style={styles.amount}>${transactions[1].amount.toFixed(2)}</Text>
                            </Animated.View>
                        )}

                        <GestureDetector gesture={panGesture}>
                            <Animated.View style={[styles.card, animatedCardStyle]}>
                                <Animated.View style={[StyleSheet.absoluteFillObject, styles.flashOverlay, flashStyle]} />

                                <View style={styles.cardHeader}>
                                    <Text style={styles.merchantName}>{currentCard.name}</Text>
                                </View>

                                <View style={styles.cardBody}>
                                    <Text style={styles.amount}>${currentCard.amount.toFixed(2)}</Text>
                                    <View style={styles.aiGuessBadge}>
                                        <Text style={styles.aiGuessText}>AI Guess: {currentCard.category || 'General'}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.footerHint}>← Edit   ↑ Rule   Approve →</Text>
                                </View>

                                <Animated.View style={[styles.swipeIndicator, styles.indicatorRight, { opacity: swipeIndicatorsStyle.rightOpacity }]}>
                                    <Check color="#10B981" size={48} />
                                </Animated.View>
                                <Animated.View style={[styles.swipeIndicator, styles.indicatorLeft, { opacity: swipeIndicatorsStyle.leftOpacity }]}>
                                    <Edit2 color="#EF4444" size={48} />
                                </Animated.View>
                                <Animated.View style={[styles.swipeIndicator, styles.indicatorUp, { opacity: swipeIndicatorsStyle.upOpacity }]}>
                                    <Zap color="#F59E0B" size={48} />
                                </Animated.View>
                            </Animated.View>
                        </GestureDetector>
                    </View>
                )}
            </View>

            {/* Category Editor Bottom Sheet */}
            <BottomSheet
                ref={categorySheetRef}
                index={-1}
                snapPoints={['55%']}
                enablePanDownToClose
                backgroundStyle={styles.bottomSheetBackground}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>Fix Category</Text>
                    <Text style={styles.sheetSubtitle}>For: {selectedTransaction?.name}</Text>

                    {categories.length > 0 ? (
                        categories.map((cat) => (
                            <Pressable
                                key={cat.id}
                                style={styles.categoryOption}
                                onPress={() => closeCategorySheetAndRemove(cat.name)}
                            >
                                <Text style={styles.categoryOptionText}>{cat.name}</Text>
                            </Pressable>
                        ))
                    ) : (
                        // Fallback if categories haven't loaded yet
                        ['Housing', 'Transport', 'Food & Drink', 'Shopping', 'Entertainment', 'Other'].map((name) => (
                            <Pressable
                                key={name}
                                style={styles.categoryOption}
                                onPress={() => closeCategorySheetAndRemove(name)}
                            >
                                <Text style={styles.categoryOptionText}>{name}</Text>
                            </Pressable>
                        ))
                    )}
                </BottomSheetView>
            </BottomSheet>

            {/* Rule Creation Bottom Sheet */}
            <BottomSheet
                ref={ruleSheetRef}
                index={-1}
                snapPoints={['70%']}
                enablePanDownToClose
                backgroundStyle={styles.bottomSheetBackground}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>Create a Rule</Text>
                    <Text style={styles.sheetSubtitle}>
                        Future transactions matching this pattern will be auto-categorised.
                    </Text>

                    <Text style={styles.ruleLabel}>Match Pattern (use * as wildcard)</Text>
                    <TextInput
                        style={styles.ruleInput}
                        value={rulePattern}
                        onChangeText={setRulePattern}
                        placeholder="e.g. AMZN* or UBER *EATS"
                        placeholderTextColor="#555"
                        autoCapitalize="characters"
                    />

                    <Text style={[styles.ruleLabel, { marginTop: 16 }]}>Assign Category</Text>
                    <View style={styles.categoryGrid}>
                        {(categories.length > 0 ? categories : [
                            { id: 'shopping', name: 'Shopping' },
                            { id: 'dining', name: 'Dining' },
                            { id: 'transport', name: 'Transport' },
                            { id: 'subscriptions', name: 'Subscriptions' },
                            { id: 'groceries', name: 'Groceries' },
                            { id: 'other', name: 'Other' },
                        ]).map((cat) => (
                            <Pressable
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategoryId === cat.id && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategoryId(cat.id)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategoryId === cat.id && styles.categoryChipTextActive,
                                ]}>
                                    {cat.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable
                        style={[
                            styles.saveRuleButton,
                            (!rulePattern.trim() || !selectedCategoryId || savingRule) && styles.saveRuleButtonDisabled,
                        ]}
                        onPress={handleSaveRule}
                        disabled={!rulePattern.trim() || !selectedCategoryId || savingRule}
                    >
                        {savingRule ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <Text style={styles.saveRuleButtonText}>Save Rule</Text>
                        )}
                    </Pressable>

                    <Pressable style={styles.cancelRuleButton} onPress={closeRuleSheetAndRemove}>
                        <Text style={styles.cancelRuleButtonText}>Skip</Text>
                    </Pressable>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
        marginBottom: 40,
    },
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackContainer: {
        position: 'relative',
        width: SCREEN_WIDTH * 0.85,
        height: SCREEN_HEIGHT * 0.5,
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: '#121212',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 24,
        justifyContent: 'space-between',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        overflow: 'hidden',
    },
    nextCard: {
        backgroundColor: '#0A0A0A',
        borderColor: '#111111',
        zIndex: -1,
        top: 10,
    },
    flashOverlay: {
        zIndex: -1,
        borderRadius: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    merchantName: {
        fontSize: 20,
        color: '#CCCCCC',
        fontFamily: 'Inter_600SemiBold',
        textAlign: 'center',
    },
    cardBody: {
        alignItems: 'center',
        gap: 16,
    },
    amount: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    aiGuessBadge: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333333',
    },
    aiGuessText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    cardFooter: {
        alignItems: 'center',
    },
    footerHint: {
        color: '#444444',
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    swipeIndicator: {
        position: 'absolute',
        top: '40%',
        padding: 20,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 2,
        zIndex: 10,
    },
    indicatorRight: {
        right: 20,
        borderColor: '#10B981',
        transform: [{ rotate: '15deg' }],
    },
    indicatorLeft: {
        left: 20,
        borderColor: '#EF4444',
        transform: [{ rotate: '-15deg' }],
    },
    indicatorUp: {
        top: 20,
        left: '35%',
        borderColor: '#F59E0B',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    lottie: {
        width: 250,
        height: 250,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#10B981',
        marginTop: 20,
        marginBottom: 8,
        fontFamily: 'Inter_700Bold',
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: '#888888',
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    bottomSheetBackground: {
        backgroundColor: '#111111',
    },
    sheetContent: {
        padding: 24,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: 'Inter_700Bold',
    },
    sheetSubtitle: {
        fontSize: 14,
        color: '#888888',
        marginBottom: 20,
        fontFamily: 'Inter_400Regular',
    },
    categoryOption: {
        backgroundColor: '#1A1A1A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    categoryOptionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
    },
    // Rule creation styles
    ruleLabel: {
        fontSize: 13,
        color: '#888888',
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    ruleInput: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333333',
        backgroundColor: '#1A1A1A',
    },
    categoryChipActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    categoryChipText: {
        color: '#888888',
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
    },
    categoryChipTextActive: {
        color: '#000000',
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    saveRuleButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveRuleButtonDisabled: {
        opacity: 0.4,
    },
    saveRuleButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    cancelRuleButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelRuleButtonText: {
        color: '#666666',
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
});
