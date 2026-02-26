import * as Haptics from 'expo-haptics';
import { Calendar as CalendarIcon, Check, ChevronDown, Crown, Download, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet, Switch, Text,
    TextInput,
    View
} from 'react-native';
import { BadgeGrid } from '../../components/achievements/BadgeGrid';
import { AddCashModal } from '../../components/AddCashModal';
import { ExportModal } from '../../components/ExportModal';
import { FeatureGate } from '../../components/FeatureGate';
import { KeyboardDoneBar } from '../../components/KeyboardDoneBar';
import { ProWaitlistModal, type ProFeature } from '../../components/ProWaitlistModal';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';
import { supabase } from '../../lib/supabase';
import {
    calculateNextPayday,
    getHolidayDates,
    getNormalizedMonthly,
    getOrdinalSuffix,
    type PayFrequency,
} from '../../utils/paydayLogic';

import { CURRENCY_LIST, SUPPORTED_CURRENCIES, formatMoney, type CurrencyCode } from '../../constants/Currencies';

// const REGIONS = ... (We might want to keep regions or map them to currencies if needed, but for now let's keep them as is or remove if user implied strict only)
// User said "Instead of building a complex system... create a strict configuration". 
// This implies we should likely remove the broad REGIONS list or strictly map it.
// For now, let's keep REGIONS but update CURRENCIES to use our constant.

const REGIONS = [
    { label: '🇬🇧  United Kingdom', value: 'United Kingdom', currency: SUPPORTED_CURRENCIES.GBP },
    { label: '🇪🇺  Europe', value: 'Europe', currency: SUPPORTED_CURRENCIES.EUR },
];


const PAY_FREQUENCIES = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'On-demand', value: 'ondemand' },
] as const;

export default function Profile() {
    const { user } = useAuth();
    const [incomeAmount, setIncomeAmount] = useState('');
    const [payFrequency, setPayFrequency] = useState<PayFrequency>('monthly');
    const [payDay, setPayDay] = useState(25); // Default: 25th
    const [workingDaysOnly, setWorkingDaysOnly] = useState(false);
    const [holidays, setHolidays] = useState<Date[]>([]);
    const [payDayModalVisible, setPayDayModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Regional settings state
    const [region, setRegion] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [regionModalVisible, setRegionModalVisible] = useState(false);
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
    const [savingRegional, setSavingRegional] = useState(false);
    const [addCashModalVisible, setAddCashModalVisible] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [waitlistFeature, setWaitlistFeature] = useState<ProFeature | null>(null);

    const { achievements, loading: achievementsLoading } = useAchievements(user?.id);

    // Fetch current profile data + holidays
    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('region, currency_code, currency_symbol, income_amount, pay_frequency, pay_day, working_days_only')
                .eq('id', user.id)
                .single();

            if (data) {
                setRegion(data.region || '');
                setCurrencyCode(data.currency_code || '');
                setCurrencySymbol(data.currency_symbol || '$');
                if (data.income_amount) setIncomeAmount(String(data.income_amount));
                if (data.pay_frequency) setPayFrequency(data.pay_frequency as PayFrequency);
                if (data.pay_day) setPayDay(data.pay_day);
                if (data.working_days_only !== null) setWorkingDaysOnly(data.working_days_only);
            }

            // Fetch holidays from calendar
            const h = await getHolidayDates(data?.region || '');
            setHolidays(h);
        }
        fetchProfile();
    }, [user]);

    // Calculate next payday reactively
    const nextPayday = useMemo(() => {
        return calculateNextPayday(payDay, workingDaysOnly, holidays);
    }, [payDay, workingDaysOnly, holidays]);

    // Compute normalized monthly for display
    const normalizedMonthly = incomeAmount
        ? getNormalizedMonthly(parseFloat(incomeAmount) || 0, payFrequency)
        : 0;

    const handleUpdateIncome = async () => {
        const rawAmount = parseFloat(incomeAmount);

        if (isNaN(rawAmount) || rawAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid income amount');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setLoading(true);

        try {
            const normalizedValue = getNormalizedMonthly(rawAmount, payFrequency);

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    income_amount: rawAmount,
                    pay_frequency: payFrequency,
                    monthly_income: normalizedValue,
                    pay_day: payDay,
                    working_days_only: workingDaysOnly,
                    next_payday: nextPayday.toISOString(),
                }, {
                    onConflict: 'id'
                });

            if (error) {
                Alert.alert('Error', error.message);
                setLoading(false);
                return;
            }

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Income Updated', `Saved as ${formatMoney(normalizedValue, currencyCode as CurrencyCode)}/month\nNext Payday: ${nextPayday.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`);
            setLoading(false);
        } catch (err) {
            console.error('Save income error:', err);
            Alert.alert('Error', 'An unexpected error occurred');
            setLoading(false);
        }
    };

    const handleSaveRegionalSettings = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        if (!region || !currencyCode) {
            Alert.alert('Error', 'Please select both region and currency');
            return;
        }

        setSavingRegional(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    region,
                    currency_code: currencyCode,
                    currency_symbol: currencySymbol,
                }, {
                    onConflict: 'id'
                });

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Settings Updated', `Regional settings saved successfully!\nSaved: ${region} with ${currencySymbol} (${currencyCode})`);
            }
        } catch {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setSavingRegional(false);
        }
    };

    const handleSelectCurrency = (currency: typeof CURRENCY_LIST[0]) => {
        setCurrencyCode(currency.code);
        setCurrencySymbol(currency.symbol);
        setCurrencyModalVisible(false);
    };

    const handleSignOut = async () => {
        setLoggingOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                Alert.alert('Error', error.message);
                setLoggingOut(false);
            }
            // AuthContext will handle the redirect
        } catch {
            Alert.alert('Error', 'An unexpected error occurred');
            setLoggingOut(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? This will permanently wipe your budget, goals, and transactions.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Heavy haptic feedback
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

                        setDeletingAccount(true);

                        try {
                            // Call Supabase RPC to delete user account
                            const { error: rpcError } = await supabase.rpc('delete_user_account');

                            if (rpcError) {
                                // If RPC doesn't exist, try alternative deletion
                                console.error('RPC Error:', rpcError.message);
                                Alert.alert('Error', 'Failed to delete account. Please contact support.');
                                setDeletingAccount(false);
                                return;
                            }

                            // Sign out and redirect
                            await supabase.auth.signOut();
                            // AuthContext will handle the redirect to signup
                        } catch (err) {
                            console.error('Delete account error:', err);
                            Alert.alert('Error', 'An unexpected error occurred');
                            setDeletingAccount(false);
                        }
                    },
                },
            ]
        );
    };

    const selectedCurrency = CURRENCY_LIST.find(c => c.code === currencyCode);

    const inputAccessoryViewID = 'incomeInputAccessory';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                    <Text style={styles.subtitle}>Manage your account settings</Text>
                </View>

                {/* Achievements Section */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <View style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 6, borderRadius: 8 }}>
                            <Crown size={20} color="#FFD700" />
                        </View>
                        <Text style={styles.sectionTitle}>Achievements</Text>
                    </View>
                    <BadgeGrid achievements={achievements} />
                </View>

                {/* Regional Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Regional Settings</Text>
                    <Text style={styles.sectionDescription}>
                        Update your region and currency preferences
                    </Text>

                    {/* Region Dropdown */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Region</Text>
                        <Pressable
                            style={styles.dropdown}
                            onPress={() => setRegionModalVisible(true)}
                        >
                            <Text style={region ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {REGIONS.find(r => r.value === region)?.label || 'Select region'}
                            </Text>
                            <ChevronDown size={20} color="#888888" />
                        </Pressable>
                    </View>

                    {/* Currency Dropdown */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Currency</Text>
                        <Pressable
                            style={styles.dropdown}
                            onPress={() => setCurrencyModalVisible(true)}
                        >
                            <Text style={currencyCode ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.symbol})` : 'Select currency'}
                            </Text>
                            <ChevronDown size={20} color="#888888" />
                        </Pressable>
                    </View>

                    <Pressable
                        style={[styles.saveButton, savingRegional && styles.buttonDisabled]}
                        onPress={handleSaveRegionalSettings}
                        disabled={savingRegional}
                    >
                        {savingRegional ? (
                            <ActivityIndicator color="#000000" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Regional Settings</Text>
                        )}
                    </Pressable>
                </View>

                {/* Found Money & Gifts Section */}
                <View style={[styles.section, styles.foundMoneySection]}>
                    <Text style={[styles.sectionTitle, styles.foundMoneyTitle]}>Found Money & Gifts</Text>
                    <Text style={styles.sectionDescription}>
                        Add extra cash from gifts or side jobs to your Safe-to-Spend or Savings.
                    </Text>

                    <Pressable
                        style={styles.addCashButton}
                        onPress={() => setAddCashModalVisible(true)}
                    >
                        <Plus size={24} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.addCashButtonText}>Add Cash</Text>
                    </Pressable>
                </View>

                {/* Add Cash Modal */}
                <AddCashModal
                    visible={addCashModalVisible}
                    onClose={() => setAddCashModalVisible(false)}
                    currencySymbol={currencySymbol}
                    onSuccess={() => {
                        // Optional: refresh profile or dashboard data if needed
                        // But dashboard data is in another tab, it will refresh on focus usually
                    }}
                />

                {/* ── Pro Features Section ──────────────────────────────── */}
                <View style={[styles.section, styles.proSection]}>
                    <View style={styles.proHeader}>
                        <Crown color="#FBBF24" size={18} />
                        <Text style={[styles.sectionTitle, styles.proTitle]}>Stash Pro</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        Premium features coming soon. Join the waitlist to be first in line.
                    </Text>

                    {/* Bank Sync */}
                    <FeatureGate
                        featureSlug="bank_sync"
                        title="Bank Sync"
                        description="Auto-import your transactions."
                        icon={<View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 8 }}><Text style={{ fontSize: 20 }}>🏦</Text></View>}
                    />

                    {/* Real Payouts */}
                    <FeatureGate
                        featureSlug="real_payouts"
                        title="Real Payouts"
                        description="Withdraw Pots to your bank."
                        icon={<View style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: 8, borderRadius: 8 }}><Text style={{ fontSize: 20 }}>💸</Text></View>}
                    />
                </View>

                {/* Pro Waitlist Modal */}
                {waitlistFeature && (
                    <ProWaitlistModal
                        visible={!!waitlistFeature}
                        onClose={() => setWaitlistFeature(null)}
                        feature={waitlistFeature}
                    />
                )}

                {/* Region Modal */}
                <Modal
                    visible={regionModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setRegionModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setRegionModalVisible(false)}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Region</Text>
                            <FlatList
                                data={REGIONS}
                                keyExtractor={(item) => item.value}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={styles.modalOption}
                                        onPress={() => {
                                            setRegion(item.value);
                                            setCurrencyCode(item.currency.code);
                                            setCurrencySymbol(item.currency.symbol);
                                            setRegionModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.modalOptionText}>{item.label}</Text>
                                        {region === item.value && <Check size={20} color="#10B981" />}
                                    </Pressable>
                                )}
                            />
                        </View>
                    </Pressable>
                </Modal>

                {/* Currency Modal */}
                <Modal
                    visible={currencyModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setCurrencyModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setCurrencyModalVisible(false)}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Currency</Text>
                            <FlatList
                                data={CURRENCY_LIST}
                                keyExtractor={(item) => item.code}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={styles.modalOption}
                                        onPress={() => handleSelectCurrency(item)}
                                    >
                                        <Text style={styles.modalOptionText}>{item.name} ({item.symbol})</Text>
                                        {currencyCode === item.code && <Check size={20} color="#10B981" />}
                                    </Pressable>
                                )}
                            />
                        </View>
                    </Pressable>
                </Modal>

                {/* Income Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Income</Text>
                    <Text style={styles.sectionDescription}>
                        Set how often you get paid and the amount
                    </Text>

                    {/* Frequency Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Pay Frequency</Text>
                        <View style={styles.frequencyRow}>
                            {PAY_FREQUENCIES.map((freq) => (
                                <Pressable
                                    key={freq.value}
                                    style={[
                                        styles.frequencyBtn,
                                        payFrequency === freq.value && styles.frequencyBtnActive,
                                    ]}
                                    onPress={() => setPayFrequency(freq.value)}
                                >
                                    <Text style={[
                                        styles.frequencyBtnText,
                                        payFrequency === freq.value && styles.frequencyBtnTextActive,
                                    ]}>
                                        {freq.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            {payFrequency === 'ondemand' ? 'Expected Monthly Amount' : `Amount per ${payFrequency === 'biweekly' ? 'Pay Period' : payFrequency === 'weekly' ? 'Week' : 'Month'}`}
                        </Text>
                        <View style={styles.inputWithPrefix}>
                            <Text style={styles.prefix}>{currencySymbol}</Text>
                            <TextInput
                                style={[styles.input, styles.inputWithPrefixField]}
                                placeholder="0.00"
                                placeholderTextColor="#666666"
                                value={incomeAmount}
                                onChangeText={setIncomeAmount}
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                            />
                        </View>
                    </View>

                    {/* Normalized Preview */}
                    {normalizedMonthly > 0 && payFrequency !== 'monthly' && (
                        <View style={styles.normalizedPreview}>
                            <Text style={styles.normalizedLabel}>Monthly equivalent</Text>
                            <Text style={styles.normalizedValue}>
                                {formatMoney(normalizedMonthly, currencyCode as CurrencyCode)}/mo
                            </Text>
                        </View>
                    )}

                    {/* Pay Day Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Pay Day</Text>
                        <Pressable
                            style={styles.dropdown}
                            onPress={() => setPayDayModalVisible(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <CalendarIcon size={18} color="#10B981" />
                                <Text style={styles.dropdownText}>
                                    {getOrdinalSuffix(payDay)} of each month
                                </Text>
                            </View>
                            <ChevronDown size={20} color="#888888" />
                        </Pressable>
                    </View>

                    {/* Working Days Toggle */}
                    <View style={styles.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleLabel}>Only on Working Days</Text>
                            <Text style={styles.toggleHint}>Shifts payday if it falls on a weekend or holiday</Text>
                        </View>
                        <Switch
                            value={workingDaysOnly}
                            onValueChange={setWorkingDaysOnly}
                            trackColor={{ false: '#333333', true: '#10B981' }}
                            thumbColor={workingDaysOnly ? '#FFFFFF' : '#666666'}
                        />
                    </View>

                    {/* Next Payday Display */}
                    <View style={styles.nextPaydayCard}>
                        <CalendarIcon size={16} color="#10B981" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.nextPaydayLabel}>Next Payday</Text>
                            <Text style={styles.nextPaydayDate}>
                                {nextPayday.toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>

                    <Pressable
                        style={[styles.saveButton, loading && styles.buttonDisabled]}
                        onPress={handleUpdateIncome}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000000" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Income</Text>
                        )}
                    </Pressable>
                </View>

                {/* Export Section */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <View style={{ backgroundColor: '#10B98115', padding: 6, borderRadius: 8 }}>
                            <Download size={18} color="#10B981" />
                        </View>
                        <Text style={styles.sectionTitle}>Export Data</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        Download your transactions as a CSV spreadsheet.
                    </Text>
                    <Pressable
                        style={styles.exportButton}
                        onPress={() => setExportModalVisible(true)}
                    >
                        <Download size={16} color="#000" />
                        <Text style={styles.exportButtonText}>Export Transactions</Text>
                    </Pressable>
                </View>

                <ExportModal
                    visible={exportModalVisible}
                    onClose={() => setExportModalVisible(false)}
                    currencySymbol={currencySymbol}
                />

                {/* Logout Section */}
                <View style={styles.logoutSection}>
                    <Pressable
                        style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
                        onPress={handleSignOut}
                        disabled={loggingOut}
                    >
                        {loggingOut ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.logoutButtonText}>Sign Out</Text>
                        )}
                    </Pressable>
                </View>

                {/* Delete Account Section */}
                <View style={styles.deleteAccountSection}>
                    <Pressable
                        style={[styles.deleteAccountButton, deletingAccount && styles.buttonDisabled]}
                        onPress={handleDeleteAccount}
                        disabled={deletingAccount}
                    >
                        {deletingAccount ? (
                            <ActivityIndicator color="#EF4444" />
                        ) : (
                            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>

            {/* Pay Day Modal */}
            <Modal
                visible={payDayModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPayDayModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setPayDayModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Pay Day</Text>
                        <FlatList
                            data={Array.from({ length: 31 }, (_, i) => i + 1)}
                            keyExtractor={(item) => String(item)}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setPayDay(item);
                                        setPayDayModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>
                                        {item}{item === 1 ? 'st' : item === 2 ? 'nd' : item === 3 ? 'rd' : 'th'}
                                    </Text>
                                    {payDay === item && <Check size={20} color="#10B981" />}
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>

            <KeyboardDoneBar nativeID={inputAccessoryViewID} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginTop: 8,
        fontFamily: 'Inter_400Regular',
    },
    section: {
        backgroundColor: '#121212',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: 'Inter_700Bold',
    },
    sectionDescription: {
        fontSize: 14,
        color: '#999999',
        marginBottom: 24,
        fontFamily: 'Inter_400Regular',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        fontFamily: 'Inter_600SemiBold',
    },
    input: {
        backgroundColor: '#000000',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#222222',
    },
    inputWithPrefix: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222222',
    },
    prefix: {
        fontSize: 16,
        color: '#10B981',
        fontWeight: '600',
        paddingLeft: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    inputWithPrefixField: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    saveButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    exportButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
    },
    exportButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
        fontFamily: 'Inter_700Bold',
    },
    logoutSection: {
        marginTop: 16,
    },
    logoutButton: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    logoutButtonText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    deleteAccountSection: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    deleteAccountButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    deleteAccountButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000000',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    dropdownText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Inter_400Regular',
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Inter_400Regular',
    },
    scrollContainer: {
        flex: 1,
    },
    keyboardAccessory: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#333333',
    },
    keyboardDoneBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    keyboardDoneBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
        fontFamily: 'Inter_600SemiBold',
    },
    foundMoneySection: {
        backgroundColor: '#1A1A1A', // Slightly lighter or same? Same as other sections is fine
        borderColor: '#FBBF24',
        borderWidth: 1,
    },
    foundMoneyTitle: {
        color: '#FBBF24',
    },
    addCashButton: {
        backgroundColor: '#FBBF24',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    addCashButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    frequencyBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: '#222222',
        alignItems: 'center',
    },
    frequencyBtnActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    frequencyBtnText: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'Inter_600SemiBold',
    },
    frequencyBtnTextActive: {
        color: '#000000',
        fontWeight: '700',
    },
    normalizedPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    normalizedLabel: {
        fontSize: 13,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
    },
    normalizedValue: {
        fontSize: 16,
        color: '#10B981',
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000000',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#222222',
    },
    toggleLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 2,
    },
    toggleHint: {
        fontSize: 11,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
    },
    nextPaydayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#10B98133',
    },
    nextPaydayLabel: {
        fontSize: 11,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    nextPaydayDate: {
        fontSize: 15,
        color: '#10B981',
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },

    // ── Pro Features section ──────────────────────────────────────────
    proSection: {
        borderColor: '#FBBF2440',
        borderWidth: 1,
        backgroundColor: '#0D0B00',
    },
    proHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    proTitle: {
        color: '#FBBF24',
    },
    proFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000000',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1A1A1A',
        marginBottom: 10,
    },
    proFeatureLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    proFeatureEmoji: {
        fontSize: 24,
    },
    proFeatureName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 2,
    },
    proFeatureHint: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'Inter_400Regular',
    },
    proBadge: {
        backgroundColor: '#FBBF2420',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#FBBF2440',
    },
    proBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FBBF24',
        letterSpacing: 1,
        fontFamily: 'Inter_700Bold',
    },
});
