import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as Notifications from 'expo-notifications';

interface NotificationListModalProps {
    visible: boolean;
    onClose: () => void;
}

interface NotificationInfo {
    identifier: string;
    title: string;
    body: string;
    trigger: string;
    scheduleId?: string;
}

export const NotificationListModal: React.FC<NotificationListModalProps> = ({
                                                                                visible,
                                                                                onClose,
                                                                            }) => {
    const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadNotifications();
        }
    }, [visible]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();

            const notificationInfos: NotificationInfo[] = scheduled.map(n => {
                let triggerText = '알 수 없음';

                // trigger 정보 파싱
                if (n.trigger && 'type' in n.trigger) {
                    const trigger = n.trigger as any;

                    // 주간 반복 알림
                    if (trigger.weekday) {
                        const days = ['일', '월', '화', '수', '목', '금', '토'];
                        const day = days[(trigger.weekday - 1) % 7] || '?';
                        const hour = trigger.hour?.toString().padStart(2, '0') || '??';
                        const minute = trigger.minute?.toString().padStart(2, '0') || '??';
                        triggerText = `매주 ${day}요일 ${hour}:${minute}`;
                    }
                    // 일회성 알림
                    else if (trigger.date) {
                        const date = new Date(trigger.date);
                        triggerText = date.toLocaleString('ko-KR');
                    }
                }

                return {
                    identifier: n.identifier,
                    title: n.content.title || '제목 없음',
                    body: n.content.body || '',
                    trigger: triggerText,
                    scheduleId: n.content.data?.scheduleId as string | undefined,
                };
            });

            // 요일 순서로 정렬
            notificationInfos.sort((a, b) => {
                const dayOrder = ['일', '월', '화', '수', '목', '금', '토'];
                const dayA = a.trigger.match(/([일월화수목금토])요일/)?.[1] || '';
                const dayB = b.trigger.match(/([일월화수목금토])요일/)?.[1] || '';

                const indexA = dayOrder.indexOf(dayA);
                const indexB = dayOrder.indexOf(dayB);

                if (indexA !== indexB) return indexA - indexB;

                // 같은 요일이면 시간순 정렬
                return a.trigger.localeCompare(b.trigger);
            });

            setNotifications(notificationInfos);
        } catch (error) {
            console.error('알림 목록 로드 실패:', error);
            Alert.alert('오류', '알림 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelNotification = async (identifier: string, title: string) => {
        Alert.alert(
            '알림 취소',
            `"${title}" 알림을 취소하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Notifications.cancelScheduledNotificationAsync(identifier);
                            await loadNotifications();
                            Alert.alert('성공', '알림이 취소되었습니다.');
                        } catch (error) {
                            console.error('알림 취소 실패:', error);
                            Alert.alert('오류', '알림 취소에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleCancelAll = () => {
        Alert.alert(
            '모든 알림 취소',
            '모든 예약된 알림을 취소하시겠습니까?\n(수업 시간표는 유지됩니다)',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Notifications.cancelAllScheduledNotificationsAsync();
                            await loadNotifications();
                            Alert.alert('성공', '모든 알림이 취소되었습니다.\n시간표를 다시 저장하면 알림이 재설정됩니다.');
                        } catch (error) {
                            console.error('알림 취소 실패:', error);
                            Alert.alert('오류', '알림 취소에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleTestNotification = async () => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🔔 테스트 알림',
                    body: '알림이 정상적으로 작동합니다!',
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 2,
                },
            });
            Alert.alert('테스트 알림', '2초 후 알림이 표시됩니다.');
        } catch (error) {
            Alert.alert('오류', '테스트 알림 전송에 실패했습니다.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <Text style={styles.title}>예약된 알림 목록</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* 정보 바 */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoLeft}>
                        <Text style={styles.infoText}>
                            총 {notifications.length}개
                        </Text>
                    </View>
                    <View style={styles.infoButtons}>
                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={handleTestNotification}
                        >
                            <Text style={styles.testButtonText}>🧪 테스트</Text>
                        </TouchableOpacity>
                        {notifications.length > 0 && (
                            <TouchableOpacity
                                style={styles.cancelAllButton}
                                onPress={handleCancelAll}
                            >
                                <Text style={styles.cancelAllText}>모두 취소</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* 알림 목록 */}
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#4a9eff" />
                            <Text style={styles.loadingText}>로딩 중...</Text>
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>예약된 알림이 없습니다</Text>
                            <Text style={styles.emptySubtext}>
                                수업을 추가하고 알림을 설정해보세요
                            </Text>
                        </View>
                    ) : (
                        notifications.map((notification, index) => (
                            <View key={notification.identifier} style={styles.notificationItem}>
                                <View style={styles.notificationNumber}>
                                    <Text style={styles.numberText}>{index + 1}</Text>
                                </View>
                                <View style={styles.notificationContent}>
                                    <Text style={styles.notificationTitle}>
                                        {notification.title}
                                    </Text>
                                    <Text style={styles.notificationBody}>
                                        {notification.body}
                                    </Text>
                                    <View style={styles.notificationFooter}>
                                        <Text style={styles.notificationTrigger}>
                                            ⏰ {notification.trigger}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleCancelNotification(
                                        notification.identifier,
                                        notification.title
                                    )}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* 하단 버튼 */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={loadNotifications}
                        disabled={loading}
                    >
                        <Text style={styles.refreshButtonText}>
                            {loading ? '로딩 중...' : '🔄 새로고침'}
                        </Text>
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
        paddingTop: 50,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#fff',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    infoLeft: {
        flex: 1,
    },
    infoText: {
        color: '#aaa',
        fontSize: 14,
        fontWeight: '600',
    },
    infoButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    testButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#4a9eff',
    },
    testButtonText: {
        color: '#4a9eff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#ff4444',
        borderRadius: 6,
    },
    cancelAllText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        color: '#aaa',
        fontSize: 16,
        marginTop: 16,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        color: '#aaa',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    notificationNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4a9eff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    numberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    notificationBody: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationTrigger: {
        color: '#4a9eff',
        fontSize: 12,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 6,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    cancelButtonText: {
        color: '#ff4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    refreshButton: {
        padding: 16,
        backgroundColor: '#4a9eff',
        borderRadius: 8,
        alignItems: 'center',
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});