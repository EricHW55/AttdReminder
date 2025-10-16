import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { DraggableTimetable } from '../timetable/DraggableTimetable';
import { GridCell, DayOfWeek, Schedule, ScheduleOccurrence, TimeSlot } from '@/src/types/schedule';
import { COLORS, TIME_SLOT_MINUTES } from '@/src/constants/timeSlots';
import { timeToMinutes, minutesToTime, formatTime } from '@/src/utils/timeHelpers';

interface DragScheduleModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (schedule: Omit<Schedule, 'id'>) => void;
    existingSchedules: Schedule[]; // 기존 시간표 전달
}

export const DragScheduleModal: React.FC<DragScheduleModalProps> = ({
                                                                        visible,
                                                                        onClose,
                                                                        onSubmit,
                                                                        existingSchedules
}) => {
    const [step, setStep] = useState<'select' | 'details'>('select');
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    // [수정] 새로운 데이터 구조에 맞는 상태
    const [occurrences, setOccurrences] = useState<ScheduleOccurrence[]>([]);

    const handleSelectionComplete = (cells: GridCell[]) => {
        if (cells.length === 0) {
            Alert.alert('알림', '시간을 선택해주세요.');
            return;
        }

        // 1. 선택된 셀들을 요일별로 그룹화합니다.
        const groupedByDay: Record<string, GridCell[]> = {};
        cells.forEach(cell => {
            if (!groupedByDay[cell.day]) {
                groupedByDay[cell.day] = [];
            }
            groupedByDay[cell.day].push(cell);
        });

        // 2. 각 요일 그룹을 순회하며 연속된 시간을 하나의 TimeSlot으로 합칩니다.
        const newOccurrences: ScheduleOccurrence[] = Object.entries(groupedByDay).map(([day, dayCells]) => {
            // 시간을 기준으로 정렬하여 시작과 끝 시간을 찾습니다.
            dayCells.sort((a, b) => timeToMinutes(a.hour, a.minute) - timeToMinutes(b.hour, b.minute));

            const startCell = dayCells[0];
            const endCell = dayCells[dayCells.length - 1];

            const startTime = { hour: startCell.hour, minute: startCell.minute };
            // 마지막 셀의 시작 시간 + 한 칸의 시간(30분)을 더해 종료 시간을 계산합니다.
            const endTime = minutesToTime(timeToMinutes(endCell.hour, endCell.minute) + TIME_SLOT_MINUTES);

            const timeSlot: TimeSlot = {
                startHour: startTime.hour,
                startMinute: startTime.minute,
                endHour: endTime.hour,
                endMinute: endTime.minute
            };

            return { day: day as DayOfWeek, timeSlot };
        });

        setOccurrences(newOccurrences);
        setStep('details'); // 다음 단계(세부 정보 입력)로 전환
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert('오류', '수업명을 입력해주세요.');
            return;
        }
        // [수정] 새로운 데이터 구조에 맞게 스케줄 객체 생성
        const newSchedule: Omit<Schedule, 'id'> = {
            name: name.trim(),
            room: room.trim(),
            occurrences,
            color: selectedColor,
            notifications: [{ id: '1', type: 'before', minutes: 10, enabled: true }], // 기본 알림 설정
        };
        onSubmit(newSchedule);
        resetState(); // 상태 초기화 후 모달 닫기
    };

    const resetState = () => {
        setStep('select');
        setName('');
        setRoom('');
        setSelectedColor(COLORS[0]);
        setOccurrences([]);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={styles.container}>
                {step === 'select' ? (
                    <DraggableTimetable
                        onSelectionComplete={handleSelectionComplete}
                        existingSchedules={existingSchedules}
                    />
                ) : (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.title}>수업 정보 입력</Text>

                        <View style={styles.selectedInfo}>
                            <Text style={styles.selectedInfoTitle}>선택된 시간</Text>
                            {occurrences.map(occ => (
                                <Text key={occ.day} style={styles.selectedInfoText}>
                                    {occ.day}요일 {formatTime(occ.timeSlot.startHour, occ.timeSlot.startMinute)} ~ {formatTime(occ.timeSlot.endHour, occ.timeSlot.endMinute)}
                                </Text>
                            ))}
                        </View>

                        <TextInput style={styles.input} placeholder="수업명" placeholderTextColor="#888" value={name} onChangeText={setName} />
                        <TextInput style={styles.input} placeholder="강의실 (선택)" placeholderTextColor="#888" value={room} onChangeText={setRoom} />

                        <Text style={styles.label}>색상 선택</Text>
                        <View style={styles.colorButtons}>
                            {COLORS.map(color => (
                                <TouchableOpacity key={color} style={[styles.colorButton, { backgroundColor: color }, selectedColor === color && styles.colorButtonActive]} onPress={() => setSelectedColor(color)} />
                            ))}
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={() => { setStep('select'); setOccurrences([]); }}>
                                <Text style={styles.buttonText}>다시 선택</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.buttonText}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    detailsContainer: { flex: 1, padding: 20, backgroundColor: '#000', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, color: '#fff', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, marginBottom: 16 },
    colorButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    colorButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    colorButtonActive: { borderColor: '#fff', borderWidth: 3 },
    selectedInfo: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 16, marginBottom: 20 },
    selectedInfoTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    selectedInfoText: { fontSize: 14, color: '#aaa', marginTop: 4 },
    buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 30 },
    backButton: { flex: 1, backgroundColor: '#333', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    submitButton: { flex: 1, backgroundColor: '#4a9eff', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

