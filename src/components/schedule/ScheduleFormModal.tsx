import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Schedule, DayOfWeek, NotificationSetting, ScheduleOccurrence, TimeSlot } from '@/src/types/schedule';
import { DAYS, COLORS } from '@/src/constants/timeSlots';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (schedule: Schedule | Omit<Schedule, 'id'>) => void;
    onDelete?: (scheduleId: string) => void;
    initialSchedule?: Partial<Schedule> | null;
};

const DEFAULT_OCCURRENCE: ScheduleOccurrence = {
    day: '월',
    timeSlot: { startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 },
};

export const ScheduleFormModal: React.FC<Props> = ({ visible, onClose, onSubmit, onDelete, initialSchedule }) => {
    const isEdit = !!initialSchedule?.id;

    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [occurrences, setOccurrences] = useState<ScheduleOccurrence[]>([]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [notifications, setNotifications] = useState<NotificationSetting[]>([]);

    useEffect(() => {
        if (visible) {
            setName(initialSchedule?.name ?? '');
            setRoom(initialSchedule?.room ?? '');
            setOccurrences(initialSchedule?.occurrences ?? [DEFAULT_OCCURRENCE]);
            setSelectedColor(initialSchedule?.color ?? COLORS[0]);
            setNotifications(initialSchedule?.notifications ?? [{ id: '1', type: 'before', minutes: 10, enabled: true }]);
        }
    }, [visible, initialSchedule]);

    const handleOccurrenceChange = <K extends keyof ScheduleOccurrence>(index: number, field: K, value: ScheduleOccurrence[K]) => {
        const newOccurrences = [...occurrences];
        newOccurrences[index] = { ...newOccurrences[index], [field]: value };
        setOccurrences(newOccurrences);
    };

    const handleTimeChange = (index: number, field: keyof TimeSlot, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        const newOccurrences = [...occurrences];
        const newTimeSlot = { ...newOccurrences[index].timeSlot, [field]: numValue };
        newOccurrences[index] = { ...newOccurrences[index], timeSlot: newTimeSlot };
        setOccurrences(newOccurrences);
    };

    const addOccurrence = () => setOccurrences([...occurrences, DEFAULT_OCCURRENCE]);
    const removeOccurrence = (index: number) => {
        if (occurrences.length > 1) {
            setOccurrences(occurrences.filter((_, i) => i !== index));
        } else {
            Alert.alert('알림', '최소 하나 이상의 수업 시간이 필요합니다.');
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert('오류', '수업명을 입력해주세요.');
            return;
        }
        const scheduleData = {
            name: name.trim(),
            room: room.trim(),
            occurrences,
            color: selectedColor,
            notifications,
        };
        if (isEdit) {
            onSubmit({ ...initialSchedule, ...scheduleData, id: initialSchedule!.id! });
        } else {
            onSubmit(scheduleData);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text style={styles.title}>{isEdit ? '수업 수정' : '수업 추가'}</Text>

                    <Text style={styles.label}>수업명</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="예: 알고리즘" placeholderTextColor="#888" />

                    <Text style={styles.label}>강의실 (선택)</Text>
                    <TextInput style={styles.input} value={room} onChangeText={setRoom} placeholder="예: 정보관 101호" placeholderTextColor="#888" />

                    <Text style={styles.label}>수업 시간</Text>
                    {occurrences.map((occurrence, index) => (
                        <View key={index} style={styles.occurrenceContainer}>
                            <View style={styles.dayButtons}>
                                {DAYS.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayButton, occurrence.day === day && styles.dayButtonActive]}
                                        onPress={() => handleOccurrenceChange(index, 'day', day)}
                                    >
                                        <Text style={[styles.dayText, occurrence.day === day && styles.dayTextActive]}>{day}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.timeInputs}>
                                <TextInput style={styles.timeInput} value={occurrence.timeSlot.startHour.toString()} onChangeText={text => handleTimeChange(index, 'startHour', text)} keyboardType="number-pad" maxLength={2} />
                                <Text style={styles.timeSeparator}>:</Text>
                                <TextInput style={styles.timeInput} value={occurrence.timeSlot.startMinute.toString().padStart(2, '0')} onChangeText={text => handleTimeChange(index, 'startMinute', text)} keyboardType="number-pad" maxLength={2} />
                                <Text style={styles.timeSeparator}>~</Text>
                                <TextInput style={styles.timeInput} value={occurrence.timeSlot.endHour.toString()} onChangeText={text => handleTimeChange(index, 'endHour', text)} keyboardType="number-pad" maxLength={2} />
                                <Text style={styles.timeSeparator}>:</Text>
                                <TextInput style={styles.timeInput} value={occurrence.timeSlot.endMinute.toString().padStart(2, '0')} onChangeText={text => handleTimeChange(index, 'endMinute', text)} keyboardType="number-pad" maxLength={2} />
                                <TouchableOpacity onPress={() => removeOccurrence(index)}>
                                    <Text style={styles.removeButton}>-</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={addOccurrence}><Text style={styles.addButtonText}>+ 시간 추가</Text></TouchableOpacity>

                    <Text style={styles.label}>색상</Text>
                    <View style={styles.colorButtons}>
                        {COLORS.map(color => (
                            <TouchableOpacity key={color} style={[styles.colorButton, { backgroundColor: color }, selectedColor === color && styles.colorButtonActive]} onPress={() => setSelectedColor(color)} />
                        ))}
                    </View>

                    {/* 알림 설정 부분은 생략 (기존 코드와 유사) */}

                    <View style={styles.buttonRow}>
                        {isEdit && onDelete && (
                            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(initialSchedule!.id!)}>
                                <Text style={styles.deleteButtonText}>삭제</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.buttonText}>취소</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}><Text style={styles.buttonText}>저장</Text></TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    scrollContainer: { padding: 20, paddingBottom: 50 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    label: { fontSize: 16, color: '#fff', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, marginBottom: 16 },
    occurrenceContainer: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 12 },
    dayButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    dayButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
    dayButtonActive: { backgroundColor: '#4a9eff' },
    dayText: { color: '#888' },
    dayTextActive: { color: '#fff', fontWeight: 'bold' },
    timeInputs: { flexDirection: 'row', alignItems: 'center' },
    timeInput: { backgroundColor: '#2a2a2a', borderRadius: 6, padding: 8, color: '#fff', width: 40, textAlign: 'center' },
    timeSeparator: { color: '#fff', marginHorizontal: 6, fontSize: 16 },
    removeButton: { color: '#ff4444', fontSize: 24, marginLeft: 'auto', padding: 8 },
    addButton: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 8 },
    addButtonText: { color: '#4a9eff', fontSize: 16 },
    colorButtons: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    colorButton: { width: 40, height: 40, borderRadius: 20 },
    colorButtonActive: { borderWidth: 3, borderColor: '#fff' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
    deleteButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#ff4444' },
    deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { flex: 1, backgroundColor: '#333', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    submitButton: { flex: 1, backgroundColor: '#4a9eff', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
