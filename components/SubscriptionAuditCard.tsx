import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle, RefreshCw, Scissors, ShieldAlert, Sparkles, Tag } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatMoney, type CurrencyCode } from '../constants/Currencies';
import { useGoals } from '../hooks/useGoals';
import {
    generateSubscriptionAudit,
    SubscriptionAuditItem,
    SubscriptionAuditResult,
} from '../lib/gemini_v2';
import { supabase } from '../lib/supabase';

const AUDIT_CACHE_KEY = 'sub_audit_cache_v2';

interface SubscriptionAuditCardProps {
    currencySymbol: string;
    currencyCode: string;
}

export function SubscriptionAuditCard({ currencySymbol, currencyCode }: SubscriptionAuditCardProps) {
    const [loading, setLoading] = useState(true);
    const [auditResult, setAuditResult] = useState<SubscriptionAuditResult | null>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideWidth, setSlideWidth] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const { goals } = useGoals();
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const fetchAudit = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch active subscriptions
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('merchant, amount, category, cycle')
                .eq('user_id', user.id)
                .eq('is_active', true);

            if (!subs || subs.length === 0) {
                setSubscriptions([]);
                setLoading(false);
                return;
            }

            setSubscriptions(subs);

            // Check cache
            const cacheKey = `${AUDIT_CACHE_KEY}_${new Date().toDateString()}_${subs.length}`;
            if (!forceRefresh) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setAuditResult(JSON.parse(cached));
                    setLoading(false);
                    return;
                }
            }

            // Generate audit via Gemini
            const result = await generateSubscriptionAudit(
                subs.map(s => ({
                    merchant: s.merchant,
                    amount: Number(s.amount),
                    category: s.category || 'General',
                    cycle: s.cycle || 'monthly',
                })),
                goals.map(g => ({
                    name: g.name,
                    target_amount: g.target_amount,
                    current_amount: g.current_amount,
                    target_date: g.target_date,
                })),
                currencySymbol
            );

            setAuditResult(result);

            // Cache if successful
            if (result.items.length > 0) {
                await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
            }
        } catch (error) {
            console.log('[SubAudit] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [goals, currencySymbol]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    const getVerdictConfig = (verdict: SubscriptionAuditItem['verdict']) => {
        switch (verdict) {
            case 'keep':
                return {
                    color: '#10B981',
                    bgColor: '#10B98115',
                    borderColor: '#10B98130',
                    label: 'KEEP',
                    Icon: CheckCircle,
                };
            case 'cut':
                return {
                    color: '#EF4444',
                    bgColor: '#EF444415',
                    borderColor: '#EF444430',
                    label: 'CUT',
                    Icon: Scissors,
                };
            case 'renegotiate':
                return {
                    color: '#FBBF24',
                    bgColor: '#FBBF2415',
                    borderColor: '#FBBF2430',
                    label: 'RENEGOTIATE',
                    Icon: Tag,
                };
        }
    };

    // No subscriptions state
    if (!loading && subscriptions.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <ShieldAlert size={20} color="#10B981" />
                    <Text style={styles.title}>AI Subscription Audit</Text>
                </View>
                <Text style={styles.emptyText}>
                    No active subscriptions tracked yet. Add subscriptions from the dashboard to get a personalized audit.
                </Text>
            </View>
        );
    }

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <ShieldAlert size={20} color="#10B981" />
                    <Text style={styles.title}>AI Subscription Audit</Text>
                </View>
                <Text style={styles.loadingHint}>Analyzing subscriptions...</Text>
                <Animated.View style={[styles.skeletonBlock, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '70%' }]} />
            </View>
        );
    }

    if (!auditResult || auditResult.items.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <ShieldAlert size={20} color="#10B981" />
                    <Text style={styles.title}>AI Subscription Audit</Text>
                </View>
                <Text style={styles.emptyText}>
                    {auditResult?.goalAccelerator || 'Unable to generate audit. Try again later.'}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <ShieldAlert size={20} color="#10B981" />
                <Text style={styles.title}>AI Subscription Audit</Text>
                <Text style={styles.slideCounter}>
                    {currentSlide + 1} / {auditResult.items.length}
                </Text>
                <Pressable
                    style={styles.refreshBtn}
                    onPress={() => fetchAudit(true)}
                    hitSlop={10}
                >
                    <RefreshCw size={14} color="#666" />
                </Pressable>
            </View>

            {/* Summary Bar */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Monthly Total</Text>
                    <Text style={styles.summaryValue}>
                        {formatMoney(auditResult.totalMonthlyCost, currencyCode as CurrencyCode)}
                    </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Potential Savings</Text>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                        {formatMoney(auditResult.potentialSavings, currencyCode as CurrencyCode)}
                    </Text>
                </View>
            </View>

            {/* Subscription Carousel */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / Math.max(slideWidth, 1));
                    setCurrentSlide(idx);
                }}
                style={styles.slideScroll}
            >
                {slideWidth > 0 && auditResult.items.map((item, index) => {
                    const config = getVerdictConfig(item.verdict);
                    const IconComponent = config.Icon;
                    return (
                        <View
                            key={index}
                            style={[styles.subCard, { width: slideWidth, borderLeftColor: config.color }]}
                        >
                            <View style={styles.subCardTop}>
                                <View style={styles.subCardInfo}>
                                    <Text style={styles.subMerchant}>{item.merchant}</Text>
                                    <Text style={styles.subAmount}>
                                        {formatMoney(item.amount, currencyCode as CurrencyCode)}/mo
                                    </Text>
                                </View>
                                <View style={[styles.verdictBadge, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
                                    <IconComponent size={12} color={config.color} />
                                    <Text style={[styles.verdictText, { color: config.color }]}>
                                        {config.label}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.subReason}>{item.reason}</Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Dot indicators */}
            {auditResult.items.length > 1 && (
                <View style={styles.dotsRow}>
                    {auditResult.items.map((_, idx) => (
                        <View
                            key={idx}
                            style={[styles.dot, idx === currentSlide && styles.dotActive]}
                        />
                    ))}
                </View>
            )}

            {/* Goal Accelerator */}
            {auditResult.goalAccelerator && (
                <View style={styles.acceleratorCard}>
                    <View style={styles.acceleratorHeader}>
                        <Sparkles size={16} color="#10B981" />
                        <Text style={styles.acceleratorLabel}>GOAL ACCELERATOR</Text>
                    </View>
                    <Text style={styles.acceleratorText}>{auditResult.goalAccelerator}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222222',
        marginTop: 20,
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        flex: 1,
    },
    refreshBtn: {
        backgroundColor: '#1A1A1A',
        padding: 8,
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        fontFamily: 'Inter_400Regular',
    },
    loadingHint: {
        fontSize: 13,
        color: '#10B981',
        fontFamily: 'Inter_600SemiBold',
    },
    skeletonBlock: {
        height: 80,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
    },
    skeletonLine: {
        height: 16,
        backgroundColor: '#1A1A1A',
        borderRadius: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 14,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#222',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: 'Inter_500Medium',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    slideScroll: {
        overflow: 'hidden',
    },
    subCard: {
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 14,
        gap: 8,
        borderLeftWidth: 3,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#333333',
    },
    dotActive: {
        width: 16,
        backgroundColor: '#10B981',
    },
    slideCounter: {
        fontSize: 11,
        color: '#555555',
        fontFamily: 'Inter_400Regular',
    },
    subCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subCardInfo: {
        flex: 1,
    },
    subMerchant: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
    },
    subAmount: {
        fontSize: 13,
        color: '#888',
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    verdictBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    verdictText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        fontFamily: 'Inter_700Bold',
    },
    subReason: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
        fontFamily: 'Inter_400Regular',
    },
    acceleratorCard: {
        backgroundColor: '#10B98110',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#10B98130',
        gap: 8,
    },
    acceleratorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    acceleratorLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
        letterSpacing: 1,
        fontFamily: 'Inter_700Bold',
    },
    acceleratorText: {
        fontSize: 14,
        color: '#E5E5E5',
        lineHeight: 20,
        fontFamily: 'Inter_400Regular',
    },
});
