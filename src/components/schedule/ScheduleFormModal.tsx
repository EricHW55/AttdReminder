import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Schedule, DayOfWeek, NotificationSetting } from '../../types/schedule';
import { DAYS, COLORS } from '../../constants/timeSlots';

type Props = {
    visible: boolean;
    onClose: () => void;
    // 추가/수정 모두 지원 (부모에서 union으로 받음)
    onSubmit: (schedule: Schedule | Omit<Schedule, 'id'>) => void | Promise<void>;
    // 삭제 버튼(수정 모드에서만 노출)
    onDelete?: (scheduleId: string) => void | Promise<void>;
    // 수정 모드일 때 넘어오는 초기값 (부분 값 OK)
    initialSchedule?: Partial<Schedule> | undefined;
};

export const ScheduleFormModal: React.FC<Props> = ({
                                                       visible,
                                                       onClose,
                                                       onSubmit,
                                                       onDelete,
                                                       initialSchedule,
                                                   }) => {
    const isEdit = !!initialSchedule?.id;

    // ── 폼 상태 ─────────────────────────────────────────────────────────────
    const [name, setName] = useState(initialSchedule?.name ?? '');
    const [room, setRoom] = useState(initialSchedule?.room ?? '');
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(initialSchedule?.days ?? []);
    const [startHour, setStartHour] = useState((initialSchedule?.timeSlot?.startHour ?? 9).toString());
    const [startMinute, setStartMinute] = useState((initialSchedule?.timeSlot?.startMinute ?? 0).toString());
    const [endHour, setEndHour] = useState((initialSchedule?.timeSlot?.endHour ?? 10).toString());
    const [endMinute, setEndMinute] = useState((initialSchedule?.timeSlot?.endMinute ?? 30).toString());
    const [selectedColor, setSelectedColor] = useState(initialSchedule?.color ?? COLORS[0]);
    const [notifications, setNotifications] = useState<NotificationSetting[]>(
        initialSchedule?.notifications ?? [{ id: '1', type: 'before', minutes: 10, enabled: true }]
    );

    // 모달이 열리거나 initialSchedule이 바뀌면 상태 동기화
    useEffect(() => {
        if (!visible) return;
        setName(initialSchedule?.name ?? '');
        setRoom(initialSchedule?.room ?? '');
        setSelectedDays(initialSchedule?.days ?? []);
        setStartHour((initialSchedule?.timeSlot?.startHour ?? 9).toString());
        setStartMinute((initialSchedule?.timeSlot?.startMinute ?? 0).toString());
        setEndHour((initialSchedule?.timeSlot?.endHour ?? 10).toString());
        setEndMinute((initialSchedule?.timeSlot?.endMinute ?? 30).toString());
        setSelectedColor(initialSchedule?.color ?? COLORS[0]);
        setNotifications(
            initialSchedule?.notifications ?? [{ id: '1', type: 'before', minutes: 10, enabled: true }]
        );
    }, [visible, initialSchedule]);

    // ── 유틸 ────────────────────────────────────────────────────────────────
    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    };

    const addNotification = () => {
        const newNotification: NotificationSetting = {
            id: Date.now().toString(),
            type: 'before',
            minutes: 10,
            enabled: true,
        };
        setNotifications((prev) => [...prev, newNotification]);
    };

    const updateNotification = (id: string, updates: Partial<NotificationSetting>) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    // ── 제출/삭제 ───────────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!name.trim()) return Alert.alert('오류', '과목명을 입력해주세요.');
        if (selectedDays.length === 0) return Alert.alert('오류', '요일을 선택해주세요.');

        const sh = clamp(parseInt(startHour || '0', 10) || 0, 0, 23);
        const sm = clamp(parseInt(startMinute || '0', 10) || 0, 0, 59);
        const eh = clamp(parseInt(endHour || '0', 10) || 0, 0, 23);
        const em = clamp(parseInt(endMinute || '0', 10) || 0, 0, 59);
        const startTotal = sh * 60 + sm;
        const endTotal = eh * 60 + em;
        if (endTotal <= startTotal) return Alert.alert('오류', '종료 시간이 시작 시간보다 늦어야 합니다.');

        const base = {
            name: name.trim(),
            room: room.trim() || undefined,
            days: selectedDays,
            timeSlot: { startHour: sh, startMinute: sm, endHour: eh, endMinute: em },
            color: selectedColor,
            notifications,
        };

        // 수정 모드면 id 포함해서 넘기고, 추가 모드면 id 없이 넘김
        if (isEdit && initialSchedule?.id) {
            onSubmit({ id: initialSchedule.id, ...base });
        } else {
            onSubmit(base);
        }
    };

    const handleDelete = () => {
        if (!isEdit || !initialSchedule?.id || !onDelete) return;
        onDelete(initialSchedule.id);
    };

    // ── UI ─────────────────────────────────────────────────────────────────
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <Text style={styles.title}>{isEdit ? '수업 수정' : '수업 추가'}</Text>

                        <View style={styles.section}>
                            <Text style={styles.label}>과목명 *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="예) 오픈소스 SW입문"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>강의실 (선택)</Text>
                            <TextInput
                                style={styles.input}
                                value={room}
                                onChangeText={setRoom}
                                placeholder="예) 원251"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>요일 *</Text>
                            <View style={styles.dayButtons}>
                                {DAYS.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayButton, selectedDays.includes(day) && styles.dayButtonActive]}
                                        onPress={() => toggleDay(day)}
                                    >
                                        <Text
                                            style={[
                                                styles.dayButtonText,
                                                selectedDays.includes(day) && styles.dayButtonTextActive,
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>시작 시간</Text>
                            <View style={styles.timeInputs}>
                                <TextInput
                                    style={styles.timeInput}
                                    value={startHour}
                                    onChangeText={setStartHour}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.timeSeparator}>:</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={startMinute}
                                    onChangeText={setStartMinute}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>종료 시간</Text>
                            <View style={styles.timeInputs}>
                                <TextInput
                                    style={styles.timeInput}
                                    value={endHour}
                                    onChangeText={setEndHour}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.timeSeparator}>:</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={endMinute}
                                    onChangeText={setEndMinute}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>색상</Text>
                            <View style={styles.colorButtons}>
                                {COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorButton,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorButtonActive,
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>알림 설정</Text>
                                <TouchableOpacity onPress={addNotification} style={styles.addButton}>
                                    <Text style={styles.addButtonText}>+ 추가</Text>
                                </TouchableOpacity>
                            </View>

                            {notifications.map((notification) => (
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
                                            value={String(notification.minutes)}
                                            onChangeText={(text) =>
                                                updateNotification(notification.id, {
                                                    minutes: Number.isNaN(parseInt(text, 10)) ? 0 : parseInt(text, 10),
                                                })
                                            }
                                            keyboardType="number-pad"
                                        />
                                        <Text style={styles.notificationText}>분</Text>

                                        <TouchableOpacity
                                            style={styles.typeButton}
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
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.buttonRow}>
                        {/* 삭제 버튼: 수정 모드 + onDelete 있을 때만 노출 */}
                        {isEdit && onDelete && initialSchedule?.id ? (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <Text style={styles.deleteButtonText}>삭제</Text>
                            </TouchableOpacity>
                        ) : null}

                        <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ── styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        maxHeight: '90%',
        padding: 20,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 16, color: '#fff', marginBottom: 8 },
    input: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16 },
    dayButtons: { flexDirection: 'row', gap: 8 },
    dayButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2a2a2a', alignItems: 'center' },
    dayButtonActive: { backgroundColor: '#4a9eff' },
    dayButtonText: { color: '#888', fontSize: 14 },
    dayButtonTextActive: { color: '#fff', fontWeight: 'bold' },
    timeInputs: { flexDirection: 'row', alignItems: 'center' },
    timeInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        width: 60,
        textAlign: 'center',
    },
    timeSeparator: { color: '#fff', fontSize: 20, marginHorizontal: 8 },
    colorButtons: { flexDirection: 'row', gap: 12 },
    colorButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    colorButtonActive: { borderColor: '#fff', borderWidth: 3 },
    addButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#4a9eff', borderRadius: 6 },
    addButtonText: { color: '#fff', fontSize: 14 },
    notificationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, marginTop: 8 },
    checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#4a9eff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    checkboxInner: { width: 14, height: 14, borderRadius: 2 },
    checkboxInnerActive: { backgroundColor: '#4a9eff' },
    notificationInputs: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    notificationMinutes: { backgroundColor: '#1a1a1a', borderRadius: 6, padding: 8, color: '#fff', width: 50, textAlign: 'center', marginRight: 8 },
    notificationText: { color: '#fff', marginRight: 8 },
    typeButton: { backgroundColor: '#4a9eff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    typeButtonText: { color: '#fff', fontSize: 14 },
    removeButton: { color: '#ff4444', fontSize: 20, marginLeft: 12, padding: 4 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20, alignItems: 'center' },
    deleteButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#ff4444' },
    deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#2a2a2a', alignItems: 'center' },
    cancelButtonText: { color: '#fff', fontSize: 16 },
    submitButton: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#4a9eff', alignItems: 'center' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
