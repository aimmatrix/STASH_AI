import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { AlertTriangle, Calendar as CalendarIcon, FileText, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubscriptionAuditCard } from '../../components/SubscriptionAuditCard';
import { WealthGrowthChart } from '../../components/WealthGrowthChart';
import { generateMonthlyReport } from '../../lib/gemini_v2';
import { supabase } from '../../lib/supabase';

const SLIDE_COLORS = ['#10B981', '#F59E0B', '#8B5CF6'];

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
    return text.trim() ? [{ title: '', body: text.trim() }] : [];
}

export default function AuditScreen() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<string | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
    const [allTransactions, setAllTransactions] = useState<any[]>([]);

    // Carousel state
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideWidth, setSlideWidth] = useState(0);
    const slideScrollRef = useRef<ScrollView>(null);

    // Animation for skeleton
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        console.log("AuditScreen v1 loaded"); // Verify new code running
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

    const requestPermissions = async () => {
        try {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            setPermissionStatus(status);
            return status === 'granted';
        } catch (error) {
            console.log('Calendar permission request failed:', error);
            return false;
        }
    };

    const fetchReportData = async (forceRefresh = false) => {
        setLoading(true);
        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 2. Fetch Profile for Currency
            const { data: profile } = await supabase
                .from('profiles')
                .select('currency_symbol, currency_code')
                .eq('id', user.id)
                .single();
            const symbol = profile?.currency_symbol || '$';
            setCurrencySymbol(symbol);
            setCurrencyCode(profile?.currency_code || 'USD');

            // 3. Fetch Transactions (Last 6 Months for chart, last 30 days for report)
            const now = new Date();
            const last6Months = new Date();
            last6Months.setMonth(now.getMonth() - 6);
            const last30Days = new Date();
            last30Days.setDate(now.getDate() - 30);

            const { data: transactions } = await supabase
                .from('transactions')
                .select('*, is_one_off')
                .eq('user_id', user.id)
                .gte('created_at', last6Months.toISOString())
                .order('created_at', { ascending: false });

            // Store all transactions for chart
            setAllTransactions(transactions || []);

            // Filter for last 30 days for report
            const recentTransactions = (transactions || []).filter(
                t => new Date(t.created_at) >= last30Days
            );

            // 4. Fetch Calendar Events (if permitted)
            let calendarEvents: any[] = [];
            const hasPermission = await requestPermissions();

            if (hasPermission) {
                try {
                    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
                    const calendarIds = calendars.map(c => c.id);

                    if (calendarIds.length > 0) {
                        const events = await Calendar.getEventsAsync(
                            calendarIds,
                            last30Days,
                            now
                        );

                        // Filter for relevant financial events
                        calendarEvents = events.filter(e =>
                            e.title.toLowerCase().includes('finance') ||
                            e.title.toLowerCase().includes('bill') ||
                            e.title.toLowerCase().includes('payment') ||
                            e.title.toLowerCase().includes('subscription')
                        );
                    }
                } catch (calError) {
                    console.warn('Error fetching calendar events:', calError);
                }
            }

            // 5. Generate Report with Gemini (with Caching)
            if (recentTransactions && recentTransactions.length > 0) {
                // Create a cache key based on Month + Year + LastTransactionID (to detect new data)
                const reportMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
                const lastTxId = recentTransactions[0]?.id || 'none';
                const cacheKey = `monthly_audit_report_${reportMonth}_${lastTxId}`;

                // ALWAYS try to load from cache first
                if (!forceRefresh) {
                    const cachedReport = await AsyncStorage.getItem(cacheKey);
                    if (cachedReport) {
                        setReport(cachedReport);
                        setLoading(false);
                        return; // Stop here if we have a cache hit
                    }
                }

                // If no cache or forceRefresh is true, then we fetch
                const reportText = await generateMonthlyReport(recentTransactions, calendarEvents, symbol);

                // Handle success/failure
                if (reportText.includes("Audit limit reached") || reportText.includes("limit reached")) {
                    // Just show the message, don't crash
                    setReport(reportText);
                } else {
                    setReport(reportText);
                    // Only cache successful reports
                    if (!reportText.includes('Unable to generate')) {
                        await AsyncStorage.setItem(cacheKey, reportText);
                    }
                }
            } else {
                setReport("Not enough transaction data to generate a report.");
            }

        } catch {
            // REMOVED console.error to prevent spamming
            setReport("Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Monthly Audit</Text>
                </View>
                <View style={styles.skeletonContainer}>
                    <Text style={styles.loadingText}>Analysing Financial Data...</Text>
                    <Animated.View style={[styles.skeletonBlock, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '80%' }]} />
                    <Animated.View style={[styles.skeletonLine, { opacity: pulseAnim, width: '60%' }]} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <FileText color="#10B981" size={24} />
                    <Text style={styles.headerTitle}>Monthly Report</Text>
                    <Pressable
                        style={styles.refreshBtn}
                        onPress={() => fetchReportData(true)}
                        hitSlop={10}
                    >
                        <RefreshCw size={16} color="#666" />
                    </Pressable>
                </View>

                {/* Wealth Growth Chart */}
                <WealthGrowthChart
                    transactions={allTransactions}
                    currencySymbol={currencySymbol}
                />

                {/* Audit Card — Swipeable carousel */}
                {(() => {
                    const auditPoints = report ? parseAuditPoints(report) : [];
                    const multiSlide = auditPoints.length > 1;
                    return (
                        <View style={styles.reportCard}>
                            <View style={styles.reportHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <AlertTriangle color="#10B981" size={20} />
                                    <Text style={styles.reportTitle}>Stash AI Auditor</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    {multiSlide && (
                                        <Text style={styles.slideCounter}>{currentSlide + 1} / {auditPoints.length}</Text>
                                    )}
                                    <Text style={styles.dateRange}>Last 30 Days</Text>
                                </View>
                            </View>

                            {multiSlide ? (
                                <>
                                    <ScrollView
                                        ref={slideScrollRef}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
                                        onMomentumScrollEnd={(e) => {
                                            const idx = Math.round(
                                                e.nativeEvent.contentOffset.x / Math.max(slideWidth, 1)
                                            );
                                            setCurrentSlide(idx);
                                        }}
                                        style={styles.slideScroll}
                                    >
                                        {slideWidth > 0 ? auditPoints.map((point, idx) => {
                                            const color = SLIDE_COLORS[idx % SLIDE_COLORS.length];
                                            return (
                                                <View
                                                    key={idx}
                                                    style={[styles.slide, { width: slideWidth, borderLeftColor: color }]}
                                                >
                                                    {point.title ? (
                                                        <Text style={[styles.slideTitle, { color }]}>
                                                            {point.title}
                                                        </Text>
                                                    ) : null}
                                                    <Text style={styles.slideBody}>{point.body}</Text>
                                                </View>
                                            );
                                        }) : null}
                                    </ScrollView>

                                    <View style={styles.dotsRow}>
                                        {auditPoints.map((_, idx) => (
                                            <View
                                                key={idx}
                                                style={[styles.dot, idx === currentSlide && styles.dotActive]}
                                            />
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.reportText}>{report}</Text>
                            )}

                            {permissionStatus === 'granted' && (
                                <View style={styles.calendarBadge}>
                                    <CalendarIcon size={12} color="#666" />
                                    <Text style={styles.calendarBadgeText}>Calendar Data Included</Text>
                                </View>
                            )}
                        </View>
                    );
                })()}

                {/* AI Subscription Audit */}
                <SubscriptionAuditCard currencySymbol={currencySymbol} currencyCode={currencyCode} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 30,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    loadingText: {
        color: '#10B981',
        marginBottom: 20,
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    skeletonContainer: {
        padding: 20,
        gap: 15,
    },
    skeletonBlock: {
        height: 150,
        backgroundColor: '#10B981',
        borderRadius: 16,
    },
    skeletonLine: {
        height: 20,
        backgroundColor: '#161616',
        borderRadius: 4,
    },
    reportCard: {
        backgroundColor: '#121212',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#222222',
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dateRange: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
    },
    reportText: {
        fontSize: 15,
        color: '#E5E5E5',
        lineHeight: 24,
        fontFamily: 'Inter_400Regular',
    },
    calendarBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
        backgroundColor: '#1A1A1A',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    calendarBadgeText: {
        fontSize: 10,
        color: '#888',
        fontFamily: 'Inter_500Medium',
    },
    refreshBtn: {
        backgroundColor: '#1A1A1A',
        padding: 8,
        borderRadius: 8,
        marginLeft: 'auto',
    },
    slideCounter: {
        fontSize: 11,
        color: '#555555',
        fontFamily: 'Inter_400Regular',
    },
    slideScroll: {
        overflow: 'hidden',
    },
    slide: {
        borderLeftWidth: 3,
        paddingLeft: 14,
        paddingRight: 4,
        paddingVertical: 6,
    },
    slideTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontFamily: 'Inter_700Bold',
        marginBottom: 6,
    },
    slideBody: {
        fontSize: 14,
        color: '#E5E5E5',
        lineHeight: 22,
        fontFamily: 'Inter_400Regular',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#333333',
    },
    dotActive: {
        width: 18,
        backgroundColor: '#10B981',
    },
});
