import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { DraggableTimetable } from '../timetable/DraggableTimetable';
import { GridCell, DayOfWeek, Schedule, NotificationSetting } from '../../types/schedule';
import { COLORS } from '../../constants/timeSlots';
import { timeToMinutes, minutesToTime } from '../../utils/timeHelpers';

interface DragScheduleModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (schedule: Omit<Schedule, 'id'>) => void;
}

export const DragScheduleModal: React.FC<DragScheduleModalProps> = ({
                                                                        visible,
                                                                        onClose,
                                                                        onSubmit,
                                                                    }) => {
    const [selectedCells, setSelectedCells] = useState<GridCell[]>([]);
    const [step, setStep] = useState<'select' | 'details'>('select');
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleSelectionComplete = (cells: GridCell[]) => {
        if (cells.length === 0) {
            Alert.alert('알림', '시간을 선택해주세요.');
            return;
        }
        setSelectedCells(cells);
    };

    const handleConfirmSelection = () => {
        if (selectedCells.length === 0) {
            Alert.alert('알림', '시간을 선택해주세요.');
            return;
        }
        setStep('details');
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert('오류', '과목명을 입력해주세요.');
            return;
        }

        // 선택된 셀들로부터 요일과 시간 추출
        const days = Array.from(new Set(selectedCells.map(cell => cell.day))) as DayOfWeek[];

        const times = selectedCells.map(cell => timeToMinutes(cell.hour, cell.minute));
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times) + 30; // 마지막 셀의 끝 시간

        const startTime = minutesToTime(minTime);
        const endTime = minutesToTime(maxTime);

        const schedule: Omit<Schedule, 'id'> = {
            name: name.trim(),
            room: room.trim() || undefined,
            days: days.sort((a, b) => {
                const order = ['월', '화', '수', '목', '금', '토', '일'];
                return order.indexOf(a) - order.indexOf(b);
            }),
            timeSlot: {
                startHour: startTime.hour,
                startMinute: startTime.minute,
                endHour: endTime.hour,
                endMinute: endTime.minute,
            },
            color: selectedColor,
            notifications: [
                { id: '1', type: 'before', minutes: 10, enabled: true },
            ],
        };

        onSubmit(schedule);
        handleReset();
    };

    const handleReset = () => {
        setSelectedCells([]);
        setStep('select');
        setName('');
        setRoom('');
        setSelectedColor(COLORS[0]);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {step === 'select' ? '시간 선택' : '수업 정보 입력'}
                    </Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                {step === 'select' ? (
                    <>
                        <View style={styles.instruction}>
                            <Text style={styles.instructionText}>
                                시간표에서 드래그하여 수업 시간을 선택하세요
                            </Text>
                        </View>
                        <DraggableTimetable onSelectionComplete={handleSelectionComplete} />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    selectedCells.length === 0 && styles.confirmButtonDisabled,
                                ]}
                                onPress={handleConfirmSelection}
                                disabled={selectedCells.length === 0}
                            >
                                <Text style={styles.confirmButtonText}>확정</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.detailsContainer}>
                        <View style={styles.section}>
                            <Text style={styles.label}>과목명 *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="예) 오픈소스 SW입문"
                                placeholderTextColor="#666"
                                autoFocus
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
                            <Text style={styles.label}>색상</Text>
                            <View style={styles.colorButtons}>
                                {COLORS.map(color => (
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

                        <View style={styles.selectedInfo}>
                            <Text style={styles.selectedInfoTitle}>선택된 시간</Text>
                            <Text style={styles.selectedInfoText}>
                                요일: {Array.from(new Set(selectedCells.map(c => c.day))).join(', ')}
                            </Text>
                            <Text style={styles.selectedInfoText}>
                                시간 블록: {selectedCells.length}개
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setStep('select')}
                            >
                                <Text style={styles.backButtonText}>← 뒤로</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>완료</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        fontSize: 24,
        color: '#fff',
        padding: 4,
    },
    instruction: {
        padding: 16,
        backgroundColor: '#1a1a1a',
    },
    instructionText: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#1a1a1a',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#4a9eff',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#2a4a6a',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailsContainer: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    colorButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorButtonActive: {
        borderColor: '#fff',
        borderWidth: 3,
    },
    selectedInfo: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },
    selectedInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    selectedInfoText: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },
    backButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    submitButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#4a9eff',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});