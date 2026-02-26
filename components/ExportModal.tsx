import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Download, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const RANGES = [
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'All Time', value: 'all' },
] as const;

type Range = typeof RANGES[number]['value'];

function getDateRange(range: Range): { from: string | null; to: string } {
    const now = new Date();
    const to = now.toISOString();

    if (range === 'month') {
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        return { from, to };
    }
    if (range === '3months') {
        const from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
        return { from, to };
    }
    if (range === '6months') {
        const from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString();
        return { from, to };
    }
    return { from: null, to };
}

function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function buildCSV(rows: any[]): string {
    const header = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Notes'].join(',');
    const lines = rows.map(r => {
        const date = new Date(r.created_at).toLocaleDateString('en-GB');
        const merchant = escapeCSV(r.merchant || r.description || '');
        const category = escapeCSV(r.category || '');
        const amount = escapeCSV(Number(r.amount).toFixed(2));
        const type = escapeCSV(r.type || (Number(r.amount) >= 0 ? 'income' : 'expense'));
        const notes = escapeCSV(r.notes || '');
        return [date, merchant, category, amount, type, notes].join(',');
    });
    return [header, ...lines].join('\n');
}

interface ExportModalProps {
    visible: boolean;
    onClose: () => void;
    currencySymbol: string;
}

export function ExportModal({ visible, onClose, currencySymbol }: ExportModalProps) {
    const { user } = useAuth();
    const [selectedRange, setSelectedRange] = useState<Range>('month');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!user) return;
        setExporting(true);

        try {
            const { from, to } = getDateRange(selectedRange);

            let query = supabase
                .from('transactions')
                .select('created_at, merchant, description, category, amount, type, notes')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (from) query = query.gte('created_at', from).lte('created_at', to);

            const { data, error } = await query;

            if (error) throw new Error(error.message);
            if (!data || data.length === 0) {
                Alert.alert('No Transactions', 'No transactions found for the selected period.');
                return;
            }

            const csv = buildCSV(data);
            const label = new Date().toISOString().split('T')[0];
            const fileName = `stash_transactions_${label}.csv`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, csv, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                Alert.alert('Sharing not available', 'Your device does not support file sharing.');
                return;
            }

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Export Transactions',
                UTI: 'public.comma-separated-values-text',
            });

            onClose();
        } catch (err: any) {
            console.log('[Export] Error:', err.message);
            Alert.alert('Export Failed', 'Something went wrong. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconWrap}>
                            <Download size={20} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Export Transactions</Text>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <X size={20} color="#666" />
                        </Pressable>
                    </View>

                    <Text style={styles.subtitle}>
                        Choose a date range and we'll generate a CSV you can open in any spreadsheet app.
                    </Text>

                    {/* Range Selector */}
                    <View style={styles.rangeGrid}>
                        {RANGES.map(r => (
                            <Pressable
                                key={r.value}
                                style={[
                                    styles.rangeBtn,
                                    selectedRange === r.value && styles.rangeBtnActive,
                                ]}
                                onPress={() => setSelectedRange(r.value)}
                            >
                                <Text style={[
                                    styles.rangeBtnText,
                                    selectedRange === r.value && styles.rangeBtnTextActive,
                                ]}>
                                    {r.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Export Button */}
                    <Pressable
                        style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
                        onPress={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Download size={16} color="#000" />
                                <Text style={styles.exportBtnText}>Export as CSV</Text>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#121212',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: '#222',
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    iconWrap: {
        backgroundColor: '#10B98115',
        padding: 8,
        borderRadius: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        flex: 1,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        lineHeight: 19,
        fontFamily: 'Inter_400Regular',
        marginBottom: 24,
    },
    rangeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 28,
    },
    rangeBtn: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    rangeBtnActive: {
        backgroundColor: '#10B98120',
        borderColor: '#10B981',
    },
    rangeBtnText: {
        fontSize: 14,
        color: '#888',
        fontFamily: 'Inter_500Medium',
    },
    rangeBtnTextActive: {
        color: '#10B981',
        fontFamily: 'Inter_600SemiBold',
    },
    exportBtn: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    exportBtnDisabled: {
        opacity: 0.5,
    },
    exportBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'Inter_700Bold',
    },
});
