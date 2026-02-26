import { Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FeatureCard, RoadmapFeature } from './FeatureCard';
import { KeyboardDoneBar } from './KeyboardDoneBar';

const ROADMAP_ACCESSORY_ID = 'roadmapInputs';

export type RoadmapStatus = 'under_review' | 'planned' | 'in_progress' | 'shipped';

const TABS: { label: string; value: RoadmapStatus }[] = [
    { label: 'Under Review', value: 'under_review' },
    { label: 'Planned', value: 'planned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Shipped', value: 'shipped' },
];

export const RoadmapScreen = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<RoadmapStatus>('under_review');
    const [features, setFeatures] = useState<RoadmapFeature[]>([]);
    const [loading, setLoading] = useState(true);

    // Suggest Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchFeatures();
    }, [activeTab, user]);

    const fetchFeatures = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // roadmap_features_with_my_vote is a view that adds has_voted for auth.uid()
            const { data, error } = await supabase
                .from('roadmap_features_with_my_vote')
                .select('id, title, description, status, vote_count, has_voted')
                .eq('status', activeTab)
                .order('vote_count', { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted: RoadmapFeature[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    status: item.status,
                    vote_count: item.vote_count || 0,
                    user_voted: item.has_voted || false,
                }));
                setFeatures(formatted);
            }
        } catch (err) {
            console.warn('Failed to fetch roadmap features', err);
            // Fallback Demo Data if the tables aren't fully set up yet
            setFeatures([
                {
                    id: 'demo1',
                    title: 'Apple Pencil Support',
                    description: 'Allow writing numbers naturally into the safe-to-spend inputs with Apple Pencil.',
                    status: activeTab,
                    vote_count: 128,
                    user_voted: false
                },
                {
                    id: 'demo2',
                    title: 'More Lottie Animations',
                    description: 'Add satisfying animations when a budget is completely green for the month.',
                    status: activeTab,
                    vote_count: 85,
                    user_voted: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleVoteToggle = async (id: string, currentlyVoted: boolean): Promise<boolean> => {
        if (!user || id.startsWith('demo')) return true; // Pretend success for demo

        try {
            const { error } = await supabase.rpc('toggle_feature_vote', {
                p_feature_id: id,
                p_user_id: user.id
            });
            if (error) throw error;
            return true;
        } catch (err) {
            console.warn('Failed to toggle vote:', err);
            return false;
        }
    };

    const handleSuggest = async () => {
        if (!user || !newTitle.trim() || !newDesc.trim()) return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from('roadmap_features').insert({
                title: newTitle.trim(),
                description: newDesc.trim(),
                status: 'under_review',
            });

            if (error) throw error;

            setModalVisible(false);
            setNewTitle('');
            setNewDesc('');

            // If we are currently looking at under_review, refetch to show the new idea
            if (activeTab === 'under_review') {
                fetchFeatures();
            }
        } catch (err) {
            console.warn('Failed to submit suggestion:', err);
            // Optionally close and mock if table is missing
            setModalVisible(false);
            setNewTitle('');
            setNewDesc('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>What we're building next 🚀</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={TABS}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => {
                        const isActive = activeTab === item.value;
                        return (
                            <Pressable
                                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                onPress={() => setActiveTab(item.value)}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    }}
                    contentContainerStyle={styles.tabListContent}
                />
            </View>

            {/* Feature List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={features}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <FeatureCard feature={item} onVoteToggle={handleVoteToggle} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nothing here right now!</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
                <Plus size={24} color="#000000" strokeWidth={2.5} />
                <Text style={styles.fabText}>Suggest a Feature</Text>
            </Pressable>

            {/* Suggest Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Suggest a Feature</Text>
                            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <X size={20} color="#888888" />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="What should we build next? (e.g. Budget templates)"
                            placeholderTextColor="#666666"
                            value={newTitle}
                            onChangeText={setNewTitle}
                            maxLength={100}
                            returnKeyType="next"
                            inputAccessoryViewID={ROADMAP_ACCESSORY_ID}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="How would you use this feature? Describe it in detail so others know why they should upvote it!"
                            placeholderTextColor="#666666"
                            value={newDesc}
                            onChangeText={setNewDesc}
                            multiline
                            textAlignVertical="top"
                            maxLength={500}
                            inputAccessoryViewID={ROADMAP_ACCESSORY_ID}
                        />

                        <Pressable
                            style={[styles.submitButton, (!newTitle || !newDesc) && styles.submitButtonDisabled]}
                            onPress={handleSuggest}
                            disabled={!newTitle || !newDesc || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#000000" size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit to Roadmap</Text>
                            )}
                        </Pressable>
                    </View>
                    <KeyboardDoneBar nativeID={ROADMAP_ACCESSORY_ID} />
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60, // account for notch area if not wrapped in SafeArea
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    tabContainer: {
        marginBottom: 16,
    },
    tabListContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#222222',
    },
    tabButtonActive: {
        backgroundColor: '#10B9811A', // transparent emerald
        borderColor: '#10B981',
    },
    tabText: {
        color: '#888888',
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Inter_500Medium',
    },
    tabTextActive: {
        color: '#10B981',
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // padding for FAB
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#666666',
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        gap: 8,
    },
    fabText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#121212',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#222222',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
    },
    input: {
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 12,
        color: '#FFFFFF',
        padding: 16,
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
        marginBottom: 16,
    },
    textArea: {
        height: 120,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    submitButtonDisabled: {
        backgroundColor: '#10B9814D', // 30% opacity
    },
    submitButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
});
