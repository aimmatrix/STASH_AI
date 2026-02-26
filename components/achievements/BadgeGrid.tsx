import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Award, Lock, Shield, Star, Trophy, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Achievement } from '../../hooks/useAchievements';

interface BadgeGridProps {
    achievements: Achievement[];
}

const ICON_MAP: Record<string, any> = {
    'starter-stash': Trophy,
    'streak-master': Zap,
    'budget-ninja': Shield,
    'wealth-builder': Star,
    'early-bird': Award,
    default: Award,
};

export const BadgeGrid: React.FC<BadgeGridProps> = ({ achievements }) => {
    const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

    const handlePressBadge = (badge: Achievement) => {
        Haptics.selectionAsync();
        setSelectedBadge(badge);
    };

    const renderBadge = (item: Achievement) => {
        const IconComponent = ICON_MAP[item.slug] || ICON_MAP.default;
        const isEarned = item.earned;

        return (
            <Pressable
                key={item.id}
                style={styles.badgeContainer}
                onPress={() => handlePressBadge(item)}
            >
                <View style={[styles.badgeCircle, isEarned ? styles.earnedBadge : styles.lockedBadge]}>
                    <IconComponent
                        size={32}
                        color={isEarned ? '#000000' : '#666666'}
                        strokeWidth={isEarned ? 2.5 : 1.5}
                    />
                    {!isEarned && (
                        <View style={styles.lockOverlay}>
                            <Lock size={16} color="#999999" />
                        </View>
                    )}
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>
                    {item.name}
                </Text>
            </Pressable>
        );
    };

    // Chunk achievements into rows of 3 for the grid
    const rows: Achievement[][] = [];
    for (let i = 0; i < achievements.length; i += 3) {
        rows.push(achievements.slice(i, i + 3));
    }

    return (
        <>
            <View style={styles.gridContainer}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((badge) => (
                            <React.Fragment key={badge.id}>
                                {renderBadge(badge)}
                            </React.Fragment>
                        ))}
                    </View>
                ))}
            </View>

            {/* Detail Modal / Bottom Sheet */}
            <Modal
                visible={!!selectedBadge}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedBadge(null)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setSelectedBadge(null)}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalBadgeCircle, selectedBadge?.earned ? styles.earnedBadge : styles.lockedBadge]}>
                                {selectedBadge && (
                                    React.createElement(ICON_MAP[selectedBadge.slug] || ICON_MAP.default, {
                                        size: 48,
                                        color: selectedBadge.earned ? '#000000' : '#666666',
                                        strokeWidth: selectedBadge.earned ? 2.5 : 1.5
                                    })
                                )}
                            </View>
                        </View>

                        <Text style={styles.modalTitle}>{selectedBadge?.name}</Text>
                        <Text style={styles.modalDescription}>{selectedBadge?.description}</Text>

                        {selectedBadge?.earned ? (
                            <View style={styles.earnedDateContainer}>
                                <Trophy size={16} color="#10B981" />
                                <Text style={styles.earnedDateText}>
                                    Earned on {new Date(selectedBadge.earnedAt || '').toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.lockedContainer}>
                                <Lock size={16} color="#666666" />
                                <Text style={styles.lockedText}>Locked</Text>
                            </View>
                        )}

                        <Pressable style={styles.closeButton} onPress={() => setSelectedBadge(null)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        paddingVertical: 10,
    },
    row: {
        justifyContent: 'flex-start', // specific 3-column often better with flex-start + gap or calc width
        gap: 12,
        marginBottom: 20,
    },
    badgeContainer: {
        width: '31%', // roughly 1/3 minus gap
        alignItems: 'center',
        marginBottom: 8,
    },
    badgeCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
    },
    earnedBadge: {
        backgroundColor: '#10B981', // Emerald Green
        borderColor: '#059669',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    lockedBadge: {
        backgroundColor: '#1A1A1A',
        borderColor: '#333333',
        opacity: 0.8,
    },
    lockOverlay: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#222222',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: '#000000',
    },
    badgeName: {
        color: '#E5E5E5',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'Inter_600SemiBold',
        height: 16, // Fixed height for one line
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#121212',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        marginBottom: 20,
    },
    modalBadgeCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'Inter_700Bold',
    },
    modalDescription: {
        fontSize: 16,
        color: '#A3A3A3',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        fontFamily: 'Inter_400Regular',
    },
    earnedDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 24,
    },
    earnedDateText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    lockedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#262626',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 24,
    },
    lockedText: {
        color: '#A3A3A3',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
    closeButton: {
        width: '100%',
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },
});
