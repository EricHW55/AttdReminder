import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { AppSettings } from '@/src/types/settings';
import { Schedule } from '@/src/types/schedule';
import { scheduleStorage } from '@/src/features/schedule/scheduleStorage';
import { notificationService } from '@/src/features/notifications/notificationService';
import { NotificationListModal } from '@/src/components/settings/NotificationListModal';
import { ScheduleNotificationModal } from '@/src/components/settings/ScheduleNotificationModal';
// [수정] 새로 만든 useSettings 훅을 가져옵니다.
import { useSettings } from '@/src/contexts/SettingsContext';
import { settingsStorage } from '@/src/features/settings/settingsStorage';

// [추가] 입력 필드 오류를 해결하기 위한 별도의 컴포넌트
const TimeInputField = ({ label, value, onChange, unit, min, max }: any) => {
    // 입력 중인 텍스트를 관리하는 내부 상태
    const [localValue, setLocalValue] = useState(String(value));

    // 부모의 데이터가 변경될 때 내부 상태를 동기화합니다.
    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);

    const handleBlur = () => {
        const numValue = parseInt(localValue, 10);
        const finalValue = isNaN(numValue) ? min : Math.min(max, Math.max(min, numValue));
        // 포커스가 해제될 때만 부모의 상태를 업데이트합니다.
        onChange(finalValue);
    };

    return (
        <View style={styles.timeInputContainer}>
            <Text style={styles.settingLabel}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.timeInput}
                    keyboardType="numeric"
                    value={localValue}
                    onChangeText={setLocalValue} // 입력 중에는 내부 상태만 변경
                    onBlur={handleBlur}
                    selectTextOnFocus
                />
                <Text style={styles.timeText}>{unit}</Text>
            </View>
        </View>
    );
};


export default function SettingsScreen() {
    // [수정] 전역 설정을 useSettings 훅을 통해 가져옵니다.
    const { settings: globalSettings, loading, updateSettings } = useSettings();

    // [수정] 사용자가 편집 중인 내용을 담을 '로컬 상태'를 만듭니다.
    const [editableSettings, setEditableSettings] = useState<AppSettings | null>(null);

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [notificationListVisible, setNotificationListVisible] = useState(false);
    const [scheduleNotificationVisible, setScheduleNotificationVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

    // 전역 설정이 로드되거나 변경되면, 로컬 편집 상태를 그에 맞게 초기화합니다.
    useEffect(() => {
        if (globalSettings) {
            setEditableSettings(globalSettings);
        }
    }, [globalSettings]);

    useEffect(() => {
        const loadSchedules = async () => {
            const loadedSchedules = await scheduleStorage.getAll();
            setSchedules(loadedSchedules);
        };
        loadSchedules();
    }, []);

    // [수정] UI에서 설정을 변경할 때, 전역 상태가 아닌 로컬 편집 상태를 변경합니다.
    const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        if (!editableSettings) return;
        setEditableSettings(prev => ({ ...prev!, [key]: value }));
    };

    // [추가] '설정 저장' 버튼을 눌렀을 때의 동작
    const handleSaveSettings = async () => {
        if (!editableSettings) return;
        try {
            // 로컬 편집 상태의 값을 전역 설정으로 업데이트합니다.
            await updateSettings(editableSettings);
            Alert.alert('성공', '설정이 저장되었습니다.');
        } catch (error) {
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        }
    };

    const handleResetSettings = async () => {
        Alert.alert('설정 초기화', '모든 설정을 초기화하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '초기화', style: 'destructive', onPress: async () => {
                    const newSettings = await settingsStorage.reset();
                    setEditableSettings(newSettings); // 편집 상태도 리셋
                    await updateSettings(newSettings); // 전역 상태도 리셋
                    Alert.alert('성공', '설정이 초기화되었습니다.');
                }},
        ]);
    };

    const handleScheduleNotificationSave = async (scheduleId: string, notifications: any[]) => {
        try {
            const schedule = schedules.find(s => s.id === scheduleId);
            if (!schedule) return;

            const updatedSchedule = { ...schedule, notifications };

            await scheduleStorage.update(scheduleId, updatedSchedule);
            await notificationService.scheduleNotification(updatedSchedule);
            await loadSchedules();
            setScheduleNotificationVisible(false);
            Alert.alert('성공', '알림 설정이 저장되었습니다.');
        } catch (e) {
            Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
        }
    };


    if (loading || !editableSettings) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>설정</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* 시간표 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>시간표 설정</Text>
                    <TimeInputField
                        label="시작 시간" value={editableSettings.startHour}
                        onChange={(value: number) => handleSettingChange('startHour', value)}
                        unit="시" min={0} max={23}
                    />
                    <TimeInputField
                        label="종료 시간" value={editableSettings.endHour}
                        onChange={(value: number) => handleSettingChange('endHour', value)}
                        unit="시" min={0} max={23}
                    />
                    <TimeInputField
                        label="시간 단위" value={editableSettings.timeSlotMinutes}
                        onChange={(value: number) => handleSettingChange('timeSlotMinutes', value)}
                        unit="분" min={15} max={60}
                    />
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>토요일 포함</Text>
                        <Switch
                            value={editableSettings.includeSaturday}
                            onValueChange={(value) => handleSettingChange('includeSaturday', value)}
                        />
                    </View>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>일요일 포함</Text>
                        <Switch
                            value={editableSettings.includeSunday}
                            onValueChange={(value) => handleSettingChange('includeSunday', value)}
                        />
                    </View>
                </View>

                {/* 알림 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>알림 설정</Text>
                    {Object.keys(editableSettings)
                        .filter(key => key.startsWith('notification'))
                        .map(key => (
                            <View style={styles.settingItem} key={key}>
                                <Text style={styles.settingLabel}>{key.replace('notification', '')}</Text>
                                <Switch
                                    value={editableSettings[key as keyof AppSettings] as boolean}
                                    onValueChange={(value) => handleSettingChange(key as keyof AppSettings, value)}
                                />
                            </View>
                        ))}
                    <TouchableOpacity style={styles.button} onPress={() => setNotificationListVisible(true)}>
                        <Text style={styles.buttonText}>📋 예약된 알림 보기</Text>
                    </TouchableOpacity>
                </View>

                {/* 수업별 알림 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>수업별 알림 설정</Text>
                    {schedules.map(schedule => (
                        <TouchableOpacity
                            key={schedule.id} style={styles.scheduleItem}
                            onPress={() => { setSelectedSchedule(schedule); setScheduleNotificationVisible(true); }}
                        >
                            <View style={[styles.scheduleColor, { backgroundColor: schedule.color }]} />
                            <View style={styles.scheduleInfo}>
                                <Text style={styles.scheduleName}>{schedule.name}</Text>
                                <Text style={styles.scheduleSubtext}>알림: {schedule.notifications.filter(n => n.enabled).length}개 활성화</Text>
                            </View>
                            <Text style={styles.scheduleArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 설정 저장 버튼 */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                        <Text style={styles.buttonText}>설정 저장</Text>
                    </TouchableOpacity>
                </View>

                {/* 기타 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기타</Text>
                    <TouchableOpacity style={styles.button} onPress={handleResetSettings}>
                        <Text style={styles.buttonText}>설정 초기화</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <NotificationListModal visible={notificationListVisible} onClose={() => setNotificationListVisible(false)} />
            <ScheduleNotificationModal
                visible={scheduleNotificationVisible}
                onClose={() => { setScheduleNotificationVisible(false); setSelectedSchedule(null); }}
                schedule={selectedSchedule}
                onSave={handleScheduleNotificationSave}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { paddingTop: 40, paddingBottom: 12, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    content: { flex: 1 },
    section: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 8, borderBottomColor: '#1a1a1a' },
    buttonSection: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    settingLabel: { fontSize: 16, color: '#ddd' },
    timeInputContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center' },
    timeInput: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 8, color: '#fff', width: 60, textAlign: 'center'},
    timeText: { color: '#aaa', fontSize: 16, marginLeft: 8 },
    saveButton: { backgroundColor: '#4a9eff', padding: 16, borderRadius: 8, alignItems: 'center' },
    button: { backgroundColor: '#2a2a2a', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 8, },
    scheduleColor: { width: 8, height: 40, borderRadius: 4, marginRight: 12, },
    scheduleInfo: { flex: 1, },
    scheduleName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4, },
    scheduleSubtext: { color: '#aaa', fontSize: 12, },
    scheduleArrow: { color: '#666', fontSize: 24, },
});

