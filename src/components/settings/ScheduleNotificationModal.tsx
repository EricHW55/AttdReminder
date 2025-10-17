import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { Schedule, ScheduleOccurrence, NotificationSetting } from '@/src/types/schedule';
import { formatTime } from '@/src/utils/timeHelpers';

interface ScheduleNotificationModalProps {
    visible: boolean;
    onClose: () => void;
    schedule: Schedule | null;
    onSave: (scheduleId: string, occurrenceIndex: number, notifications: NotificationSetting[]) => void;
}

export const ScheduleNotificationModal: React.FC<ScheduleNotificationModalProps> = ({
                                                                                        visible,
                                                                                        onClose,
                                                                                        schedule,
                                                                                        onSave,
                                                                                    }) => {
    const [selectedOccurrenceIndex, setSelectedOccurrenceIndex] = useState(0);
    const [notifications, setNotifications] = useState<NotificationSetting[]>([]);

    useEffect(() => {
        if (schedule && visible) {
            setSelectedOccurrenceIndex(0);
            // 전역 notifications를 기본값으로 사용
            setNotifications(schedule.notifications || []);
        }
    }, [schedule, visible]);

    const addNotification = () => {
        const newNotification: NotificationSetting = {
            id: Date.now().toString(),
            type: 'before',
            minutes: 5,
            enabled: true,
        };
        setNotifications([...notifications, newNotification]);
    };

    const updateNotification = (id: string, updates: Partial<NotificationSetting>) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, ...updates } : n))
        );
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleSave = () => {
        if (!schedule) return;
        onSave(schedule.id, selectedOccurrenceIndex, notifications);
        onClose();
    };

    if (!schedule) return null;

    const currentOccurrence = schedule.occurrences[selectedOccurrenceIndex];

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{schedule.name} - 알림 설정</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* 수업 시간 선택 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>수업 시간 선택</Text>
                        {schedule.occurrences.map((occ, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.occurrenceButton,
                                    selectedOccurrenceIndex === index && styles.occurrenceButtonActive,
                                ]}
                                onPress={() => setSelectedOccurrenceIndex(index)}
                            >
                                <Text style={[
                                    styles.occurrenceText,
                                    selectedOccurrenceIndex === index && styles.occurrenceTextActive,
                                ]}>
                                    {occ.day}요일 {formatTime(occ.timeSlot.startHour, occ.timeSlot.startMinute)} ~ {formatTime(occ.timeSlot.endHour, occ.timeSlot.endMinute)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 알림 설정 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>알림 설정</Text>
                            <TouchableOpacity onPress={addNotification} style={styles.addButton}>
                                <Text style={styles.addButtonText}>+ 추가</Text>
                            </TouchableOpacity>
                        </View>

                        {notifications.length === 0 ? (
                            <Text style={styles.emptyText}>알림이 없습니다. 추가 버튼을 눌러주세요.</Text>
                        ) : (
                            notifications.map(notification => (
                                <View key={notification.id} style={styles.notificationItem}>
                                    <TouchableOpacity
                                        style={styles.checkbox}
                                        onPress={() =>
                                            updateNotification(notification.id, { enabled: !notification.enabled })
                                        }
                                    >
                                        <View
                                            style={[
                                                styles.checkboxInner,
                                                notification.enabled && styles.checkboxInnerActive,
                                            ]}
                                        />
                                    </TouchableOpacity>

                                    <View style={styles.notificationInputs}>
                                        <TextInput
                                            style={styles.notificationMinutes}
                                            value={notification.minutes.toString()}
                                            onChangeText={text =>
                                                updateNotification(notification.id, { minutes: parseInt(text) || 0 })
                                            }
                                            keyboardType="number-pad"
                                        />
                                        <Text style={styles.notificationText}>분</Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.typeButton,
                                                notification.type === 'after' && styles.typeButtonAfter,
                                            ]}
                                            onPress={() =>
                                                updateNotification(notification.id, {
                                                    type: notification.type === 'before' ? 'after' : 'before',
                                                })
                                            }
                                        >
                                            <Text style={styles.typeButtonText}>
                                                {notification.type === 'before' ? '전' : '후'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity onPress={() => removeNotification(notification.id)}>
                                        <Text style={styles.removeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>저장</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    closeButton: {
        fontSize: 24,
        color: '#fff',
        padding: 4,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    occurrenceButton: {
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    occurrenceButtonActive: {
        borderColor: '#4a9eff',
        backgroundColor: '#1a3a5a',
    },
    occurrenceText: {
        color: '#aaa',
        fontSize: 14,
    },
    occurrenceTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    addButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#4a9eff',
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#4a9eff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxInner: {
        width: 14,
        height: 14,
        borderRadius: 2,
    },
    checkboxInnerActive: {
        backgroundColor: '#4a9eff',
    },
    notificationInputs: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationMinutes: {
        backgroundColor: '#0a0a0a',
        borderRadius: 6,
        padding: 8,
        color: '#fff',
        width: 50,
        textAlign: 'center',
        marginRight: 8,
    },
    notificationText: {
        color: '#fff',
        marginRight: 8,
    },
    typeButton: {
        backgroundColor: '#4a9eff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    typeButtonAfter: {
        backgroundColor: '#ff9966',
    },
    typeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    removeButton: {
        color: '#ff4444',
        fontSize: 20,
        marginLeft: 12,
        padding: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#333',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#4a9eff',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});