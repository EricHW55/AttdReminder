import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    PanResponder,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { DayOfWeek, GridCell, Schedule } from '@/src/types/schedule';
import { formatTime, timeToMinutes } from '@/src/utils/timeHelpers';
// [수정] 올바른 context 경로에서 useSettings 훅을 가져옵니다.
import { useSettings } from '../../contexts/SettingsContext';

interface DraggableTimetableWithSchedulesProps {
    onSelectionComplete: (cells: GridCell[]) => void;
    existingSchedules: Schedule[];
}

const CELL_HEIGHT = 55;
const TIME_COLUMN_WIDTH = 50;

export const DraggableTimetable: React.FC<DraggableTimetableWithSchedulesProps> = ({
                                                                                       onSelectionComplete,
                                                                                       existingSchedules,
                                                                                   }) => {
    // [수정] useSettings 훅의 반환값 구조에 맞게 값을 가져옵니다.
    // days와 loading은 바로 사용하고, 시간 관련 설정은 settings 객체에서 꺼내 씁니다.
    const { settings, days, loading } = useSettings();
    const { startHour, endHour, timeSlotMinutes } = settings;

    // 동적으로 계산되는 상수들을 훅에서 값을 가져온 후 계산하도록 변경
    const DAY_COLUMN_WIDTH = (Dimensions.get('window').width - TIME_COLUMN_WIDTH) / (days.length > 0 ? days.length : 1);

    // 시간 배열을 settings 값에 따라 동적으로 생성
    const hours = React.useMemo(() => Array.from(
        { length: (endHour - startHour) * (60 / timeSlotMinutes) },
        (_, i) => {
            const totalMinutes = startHour * 60 + i * timeSlotMinutes;
            return {
                hour: Math.floor(totalMinutes / 60),
                minute: totalMinutes % 60,
            };
        }
    ), [startHour, endHour, timeSlotMinutes]);

    const TOTAL_GRID_HEIGHT = hours.length * CELL_HEIGHT;
    const TOTAL_GRID_WIDTH = DAY_COLUMN_WIDTH * days.length;

    // ... (나머지 상태 및 핸들러 로직은 기존과 동일합니다)
    const [selectedCells, setSelectedCells] = React.useState<GridCell[]>([]);
    const [isPaintMode, setIsPaintMode] = React.useState(false);

    const isPaintModeRef = React.useRef(isPaintMode);
    React.useEffect(() => { isPaintModeRef.current = isPaintMode; }, [isPaintMode]);

    const selectedCellsRef = React.useRef(selectedCells);
    React.useEffect(() => { selectedCellsRef.current = selectedCells; }, [selectedCells]);

    const startCellRef = React.useRef<GridCell | null>(null);
    const dragModeRef = React.useRef<'paint' | 'erase' | null>(null);
    const selectionAtDragStartRef = React.useRef<Set<string>>(new Set());

    const cellToString = (cell: GridCell): string => `${cell.day}-${cell.hour}-${cell.minute}`;
    const stringToCell = (str: string): GridCell => {
        const [day, hour, minute] = str.split('-');
        return { day: day as DayOfWeek, hour: Number(hour), minute: Number(minute) };
    };

    const getCellFromCoordinates = (x: number, y: number): GridCell | null => {
        const dayIndex = Math.floor(x / DAY_COLUMN_WIDTH);
        const timeIndex = Math.floor(y / CELL_HEIGHT);

        if (dayIndex < 0 || dayIndex >= days.length || timeIndex < 0 || timeIndex >= hours.length) {
            return null;
        }

        return {
            day: days[dayIndex],
            hour: hours[timeIndex].hour,
            minute: hours[timeIndex].minute,
        };
    };

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isPaintModeRef.current,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const cell = getCellFromCoordinates(locationX, locationY);
                if (!cell) return;

                startCellRef.current = cell;
                selectionAtDragStartRef.current = new Set(selectedCellsRef.current.map(cellToString));
                const cellStr = cellToString(cell);

                if (selectionAtDragStartRef.current.has(cellStr)) {
                    dragModeRef.current = 'erase';
                    selectionAtDragStartRef.current.delete(cellStr);
                } else {
                    dragModeRef.current = 'paint';
                    selectionAtDragStartRef.current.add(cellStr);
                }
                setSelectedCells(Array.from(selectionAtDragStartRef.current).map(stringToCell));
            },
            onPanResponderMove: (evt) => {
                const startCell = startCellRef.current;
                if (!startCell) return;

                const { locationX, locationY } = evt.nativeEvent;
                const currentCell = getCellFromCoordinates(locationX, locationY);
                if (!currentCell) return;

                const newSelection = new Set(selectionAtDragStartRef.current);

                const startDayIndex = days.indexOf(startCell.day);
                const currentDayIndex = days.indexOf(currentCell.day);
                const minDayIndex = Math.min(startDayIndex, currentDayIndex);
                const maxDayIndex = Math.max(startDayIndex, currentDayIndex);

                const startTimeIndex = hours.findIndex(h => h.hour === startCell.hour && h.minute === startCell.minute);
                const currentTimeIndex = hours.findIndex(h => h.hour === currentCell.hour && h.minute === currentCell.minute);
                const minTimeIndex = Math.min(startTimeIndex, currentTimeIndex);
                const maxTimeIndex = Math.max(startTimeIndex, currentTimeIndex);

                for (let d = minDayIndex; d <= maxDayIndex; d++) {
                    for (let t = minTimeIndex; t <= maxTimeIndex; t++) {
                        // hours 배열이 존재하지 않을 수 있으므로 방어 코드 추가
                        if (days[d] && hours[t]) {
                            const cellInRectStr = cellToString({ day: days[d], hour: hours[t].hour, minute: hours[t].minute });
                            if (dragModeRef.current === 'paint') {
                                newSelection.add(cellInRectStr);
                            } else if (dragModeRef.current === 'erase') {
                                newSelection.delete(cellInRectStr);
                            }
                        }
                    }
                }
                setSelectedCells(Array.from(newSelection).map(stringToCell));
            },
            onPanResponderRelease: () => {
                startCellRef.current = null;
                dragModeRef.current = null;
                selectionAtDragStartRef.current.clear();
            },
        })
    ).current;

    const handlePaintModeToggle = () => {
        const newMode = !isPaintMode;
        setIsPaintMode(newMode);
        if (!newMode) {
            onSelectionComplete(selectedCellsRef.current);
        }
    };

    const isCellSelected = (day: DayOfWeek, hour: number, minute: number) => {
        return selectedCells.some(cell => cell.day === day && cell.hour === hour && cell.minute === minute);
    };

    // 기존 시간표 렌더링 함수
    const renderScheduleForDay = (schedule: Schedule, day: DayOfWeek) => {
        const dayOccurrences = schedule.occurrences?.filter(o => o.day === day) ?? [];
        if (dayOccurrences.length === 0) return null;

        return dayOccurrences.map((occ, idx) => {
            const { startHour: start_Hour, startMinute: start_Minute, endHour: end_Hour, endMinute: end_Minute } = occ.timeSlot;

            const startTotalMinutes = timeToMinutes(start_Hour, start_Minute);
            const endTotalMinutes = timeToMinutes(end_Hour, end_Minute);

            const top = ((startTotalMinutes - startHour * 60) / timeSlotMinutes) * CELL_HEIGHT;
            const height = ((endTotalMinutes - startTotalMinutes) / timeSlotMinutes) * CELL_HEIGHT;

            if (top < 0 || top + height > hours.length * CELL_HEIGHT) return null;

            return (
                <View
                    key={`${schedule.id}-${day}-${start_Hour}-${start_Minute}-${idx}`}
                    style={[
                        styles.scheduleBlock,
                        {
                            top,
                            height,
                            backgroundColor: schedule.color,
                            opacity: 0.7, // 기존 시간표는 약간 투명하게
                        }
                    ]}
                    pointerEvents="none" // 드래그 방해하지 않도록
                >
                    <Text style={styles.scheduleText} numberOfLines={2}>{schedule.name}</Text>
                    {schedule.room && <Text style={styles.scheduleRoomText}>{schedule.room}</Text>}
                </View>
            );
        });
    };

    if (loading) {
        return <View style={styles.fullContainer}><ActivityIndicator size="large" color="#fff" /></View>;
    }

    return (
        <View style={styles.fullContainer}>
            <ScrollView style={styles.container} scrollEnabled={!isPaintMode}>
                <View style={styles.header}>
                    <View style={{ width: TIME_COLUMN_WIDTH }} />
                    {days.map(day => (
                        <View key={day} style={[styles.headerCell, { width: DAY_COLUMN_WIDTH }]}>
                            <Text style={styles.headerText}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.body}>
                    <View style={styles.timeColumn}>
                        {hours.map(({ hour, minute }) => (
                            minute === 0 && (
                                <View key={`${hour}-${minute}`} style={[styles.timeCell, { height: CELL_HEIGHT * (60 / timeSlotMinutes) }]}>
                                    <Text style={styles.timeText}>{formatTime(hour, 0)}</Text>
                                </View>
                            )
                        ))}
                    </View>
                    <View>
                        <View style={styles.gridContainer}>
                            {days.map(day => (
                                <View key={day} style={[styles.dayColumn, { width: DAY_COLUMN_WIDTH }]}>
                                    {hours.map(({ hour, minute }) => (
                                        <View
                                            key={`${hour}-${minute}`}
                                            style={[
                                                styles.cell,
                                                { height: CELL_HEIGHT },
                                                isCellSelected(day, hour, minute) && styles.selectedCell,
                                            ]}
                                        />
                                    ))}
                                    {/* 기존 시간표 렌더링 */}
                                    {existingSchedules.map(schedule => renderScheduleForDay(schedule, day))}
                                </View>
                            ))}
                        </View>
                        {isPaintMode && <View {...panResponder.panHandlers} style={[styles.gestureContainer, {width: TOTAL_GRID_WIDTH, height: TOTAL_GRID_HEIGHT}]} />}
                    </View>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.paintButton, isPaintMode && styles.paintButtonActive]}
                    onPress={handlePaintModeToggle}
                >
                    <Text style={styles.paintButtonText}>{isPaintMode ? '완료' : '칠하기'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    container: { flex: 1, width: '100%' },
    header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#333' },
    headerCell: { height: 40, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#333' },
    headerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    body: { flexDirection: 'row' },
    timeColumn: { width: TIME_COLUMN_WIDTH },
    timeCell: { borderBottomWidth: 1, borderBottomColor: '#333', borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 10 },
    timeText: { color: '#888', fontSize: 12, position: 'relative', top: -8, backgroundColor: '#000', paddingHorizontal: 2 },
    gridContainer: { flexDirection: 'row' },
    dayColumn: { position: 'relative' },
    cell: { borderBottomWidth: 1, borderBottomColor: '#333', borderRightWidth: 1, borderRightColor: '#333' },
    selectedCell: { backgroundColor: 'rgba(74, 158, 255, 0.4)', borderColor: 'rgba(74, 158, 255, 0.8)', borderWidth: 0.5 },
    scheduleBlock: { position: 'absolute', left: '2%', right: '2%', borderRadius: 8, padding: 6, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
    scheduleText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
    scheduleRoomText: { color: 'white', fontSize: 9, opacity: 0.8, textAlign: 'right' },
    gestureContainer: { position: 'absolute', top: 0, left: 0, backgroundColor: 'transparent' },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#1a1a1a', width: '100%' },
    paintButton: { backgroundColor: '#333', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    paintButtonActive: { backgroundColor: '#4a9eff' },
    paintButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

