import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Calendar as CalendarIcon, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_COLORS } from '../constants/Categories';
import { formatMoney, type CurrencyCode } from '../constants/Currencies';
import { generateMonthlyAudit } from '../lib/gemini_v2';

const SLIDE_CONFIG = [
    { color: '#10B981', Icon: TrendingUp },
    { color: '#F59E0B', Icon: TrendingDown },
    { color: '#8B5CF6', Icon: Sparkles },
] as const;

function parseAuditPoints(text: string): { title: string; body: string }[] {
    // Match "- **Title**: body" or "- **Title** body"
    const matches = [...text.matchAll(/^[-•]\s+\*\*(.+?)\*\*[:\s]*(.+)/gm)];
    if (matches.length > 0) {
        return matches.map(m => ({ title: m[1].trim(), body: m[2].trim() }));
    }
    // Fallback: plain bullet lines
    const lines = text.split('\n').filter(l => /^[-•]\s+/.test(l.trim()));
    if (lines.length > 0) {
        return lines.map(l => ({ title: '', body: l.replace(/^[-•]\s+/, '').trim() }));
    }
    return text.trim() ? [{ title: 'Audit', body: text.trim() }] : [];
}

function extractCTA(text: string): string | null {
    const match = text.match(/Should I move .+\?/i);
    return match ? match[0] : null;
}

interface MonthlyReviewCardProps {
    monthlyIncome: number;
    totalSpentThisMonth: number;
    netSavings: number;
    categorySpending: Record<string, number>;
    currencySymbol: string;
    currencyCode: string;
    weeklySurplus: number;
    goals: any[];
}

// Category colors imported from constants/Categories.ts

export function MonthlyReviewCardNew({
    monthlyIncome,
    totalSpentThisMonth,
    netSavings,
    categorySpending,
    currencySymbol,
    currencyCode,
    weeklySurplus,
    goals,
}: MonthlyReviewCardProps) {
    const [auditContext, setAuditContext] = React.useState<string | null>(null);
    const [loadingAudit, setLoadingAudit] = React.useState(false);
    const [currentSlide, setCurrentSlide] = React.useState(0);
    const [slideWidth, setSlideWidth] = React.useState(0);
    const scrollRef = React.useRef<ScrollView>(null);

    const auditPoints = React.useMemo(
        () => (auditContext ? parseAuditPoints(auditContext) : []),
        [auditContext],
    );
    const cta = React.useMemo(
        () => (auditContext ? extractCTA(auditContext) : null),
        [auditContext],
    );

    React.useEffect(() => {
        console.log("MonthlyReviewCardNew v1 loaded"); // Verify new code running
        const fetchAudit = async () => {
            // Only fetch if we have data to avoid empty/weird prompts
            if (Object.keys(categorySpending).length > 0) {
                setLoadingAudit(true);
                try {
                    let calendarEvents: any[] = [];
                    try {
                        const { status } = await Calendar.requestCalendarPermissionsAsync();
                        if (status === 'granted') {
                            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
                            const financeCalendar = calendars.find(c => c.title === 'Finance');

                            if (financeCalendar) {
                                const endDate = new Date();
                                const startDate = new Date();
                                startDate.setMonth(startDate.getMonth() - 1);

                                calendarEvents = await Calendar.getEventsAsync(
                                    [financeCalendar.id],
                                    startDate,
                                    endDate
                                );
                            }
                        }
                    } catch {
                        // Fail silently for calendar
                    }

                    // Check Cache First
                    const cacheKey = `monthly_audit_v2_${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;

                    const cachedAudit = await AsyncStorage.getItem(cacheKey);
                    if (cachedAudit) {
                        setAuditContext(cachedAudit);
                        setLoadingAudit(false);
                        return;
                    }

                    const text = await generateMonthlyAudit(categorySpending, weeklySurplus, goals, currencySymbol, calendarEvents, monthlyIncome, totalSpentThisMonth);

                    // Cache successful result
                    if (text && !text.includes('Unable to generate') && !text.includes('limit reached')) {
                        await AsyncStorage.setItem(cacheKey, text);
                    }

                    setAuditContext(text);
                } catch {
                    // Fail silently
                    setAuditContext("Unable to generate monthly audit at this time.");
                } finally {
                    setLoadingAudit(false);
                }
            }
        };
        fetchAudit();
    }, [categorySpending, weeklySurplus, goals, currencySymbol, monthlyIncome, totalSpentThisMonth]);
    // Get current month name
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Sort categories by spending amount (descending)
    const sortedCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 categories

    // Find max spending for bar scaling
    const maxSpending = sortedCategories.length > 0
        ? Math.max(...sortedCategories.map(([, v]) => v))
        : 1;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <CalendarIcon color="#10B981" size={18} />
                <Text style={styles.headerText}>{monthName} Review</Text>
            </View>

            {/* Income vs Expenses Summary */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <View style={styles.summaryLabelRow}>
                        <TrendingUp color="#10B981" size={14} />
                        <Text style={styles.summaryLabel}>Income</Text>
                    </View>
                    <Text style={styles.incomeAmount}>{formatMoney(monthlyIncome, currencyCode as CurrencyCode)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <View style={styles.summaryLabelRow}>
                        <TrendingDown color="#64748B" size={14} />
                        <Text style={styles.summaryLabel}>Expenses</Text>
                    </View>
                    <Text style={styles.expenseAmount}>{formatMoney(totalSpentThisMonth, currencyCode as CurrencyCode)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Net</Text>
                    <Text style={[
                        styles.netAmount,
                        { color: netSavings >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                        {netSavings >= 0 ? '+' : ''}{formatMoney(netSavings, currencyCode as CurrencyCode)}
                    </Text>
                </View>
            </View>

            {/* AI Strategic Audit — Swipeable Cards */}
            <View style={styles.auditSection}>
                <View style={styles.auditHeader}>
                    <Sparkles size={16} color="#10B981" />
                    <Text style={styles.auditTitle}>Stash AI Strategic Audit</Text>
                    {!loadingAudit && auditPoints.length > 1 && (
                        <Text style={styles.auditCounter}>{currentSlide + 1} / {auditPoints.length}</Text>
                    )}
                </View>

                {loadingAudit ? (
                    <Text style={styles.auditText}>Analyzing your monthly performance...</Text>
                ) : auditPoints.length > 0 ? (
                    <>
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
                            {slideWidth > 0 && auditPoints.map((point, idx) => {
                                const config = SLIDE_CONFIG[idx % SLIDE_CONFIG.length];
                                const Icon = config.Icon;
                                const isLast = idx === auditPoints.length - 1;
                                return (
                                    <View
                                        key={idx}
                                        style={[styles.slide, { width: slideWidth, borderLeftColor: config.color }]}
                                    >
                                        {point.title ? (
                                            <View style={styles.slideTitleRow}>
                                                <Icon size={13} color={config.color} />
                                                <Text style={[styles.slideTitle, { color: config.color }]}>
                                                    {point.title}
                                                </Text>
                                            </View>
                                        ) : null}
                                        <Text style={styles.slideBody}>{point.body}</Text>
                                        {isLast && cta ? (
                                            <Text style={styles.slideCTA}>{cta}</Text>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {auditPoints.length > 1 && (
                            <View style={styles.dotsRow}>
                                {auditPoints.map((_, idx) => (
                                    <View
                                        key={idx}
                                        style={[styles.dot, idx === currentSlide && styles.dotActive]}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    <Text style={styles.auditText}>{auditContext}</Text>
                )}
            </View>

            {/* Category Bar Chart */}
            {sortedCategories.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>Spending by Category</Text>
                    {sortedCategories.map(([category, amount]) => (
                        <View key={category} style={styles.barRow}>
                            <Text style={styles.barLabel}>{category}</Text>
                            <View style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            width: `${(amount / maxSpending) * 100}%`,
                                            backgroundColor: CATEGORY_COLORS[category] || '#64748B',
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.barAmount}>{formatMoney(amount, currencyCode as CurrencyCode)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#121212',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#222222',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#222222',
    },
    incomeAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
        fontFamily: 'Inter_700Bold',
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#64748B',
        fontFamily: 'Inter_700Bold',
    },
    netAmount: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    chartSection: {
        gap: 8,
    },
    chartTitle: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
        marginBottom: 4,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    barLabel: {
        width: 80,
        fontSize: 12,
        color: '#FFFFFF',
        fontFamily: 'Inter_400Regular',
    },
    barContainer: {
        flex: 1,
        height: 12,
        backgroundColor: '#1A1A1A',
        borderRadius: 6,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 6,
    },
    barAmount: {
        width: 50,
        fontSize: 12,
        color: '#AAAAAA',
        fontFamily: 'Inter_400Regular',
        textAlign: 'right',
    },
    auditSection: {
        marginTop: 16,
        paddingTop: 12,
        paddingHorizontal: 12,
        paddingBottom: 12,
        backgroundColor: '#161616',
        borderRadius: 12,
        marginBottom: 16,
    },
    auditHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    auditTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    auditCounter: {
        marginLeft: 'auto' as any,
        fontSize: 11,
        color: '#555555',
        fontFamily: 'Inter_400Regular',
    },
    auditText: {
        fontSize: 13,
        color: '#CCCCCC',
        lineHeight: 20,
        fontFamily: 'Inter_400Regular',
    },
    slideScroll: {
        overflow: 'hidden',
    },
    slide: {
        borderLeftWidth: 2,
        paddingLeft: 10,
        paddingRight: 4,
        paddingVertical: 4,
    },
    slideTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 6,
    },
    slideTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontFamily: 'Inter_700Bold',
    },
    slideBody: {
        fontSize: 13,
        color: '#CCCCCC',
        lineHeight: 20,
        fontFamily: 'Inter_400Regular',
    },
    slideCTA: {
        marginTop: 10,
        fontSize: 13,
        color: '#10B981',
        fontFamily: 'Inter_400Regular',
        fontStyle: 'italic',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
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
});
