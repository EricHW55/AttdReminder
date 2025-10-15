import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    PanResponder,
    TouchableOpacity,
} from 'react-native';
import { DayOfWeek, GridCell } from '@/src/types/schedule';
import { DAYS, START_HOUR, END_HOUR, TIME_SLOT_MINUTES } from '@/src/constants/timeSlots';
import { formatTime } from '@/src/utils/timeHelpers';

interface DraggableTimetableProps {
    onSelectionComplete: (cells: GridCell[]) => void;
}

const CELL_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 50;
const DAY_COLUMN_WIDTH = (Dimensions.get('window').width - TIME_COLUMN_WIDTH) / DAYS.length;
const TOTAL_GRID_HEIGHT = (END_HOUR - START_HOUR) * (60 / TIME_SLOT_MINUTES) * CELL_HEIGHT;
const TOTAL_GRID_WIDTH = DAY_COLUMN_WIDTH * DAYS.length;


export const DraggableTimetable: React.FC<DraggableTimetableProps> = ({
                                                                          onSelectionComplete,
                                                                      }) => {
    const [selectedCells, setSelectedCells] = useState<GridCell[]>([]);
    const [isPaintMode, setIsPaintMode] = useState(false);

    // Stale closure 문제를 해결하기 위한 Ref들
    const isPaintModeRef = useRef(isPaintMode);
    useEffect(() => {
        isPaintModeRef.current = isPaintMode;
    }, [isPaintMode]);

    const selectedCellsRef = useRef(selectedCells);
    useEffect(() => {
        selectedCellsRef.current = selectedCells;
    }, [selectedCells]);

    const startCellRef = useRef<GridCell | null>(null);
    const dragModeRef = useRef<'paint' | 'erase' | null>(null);
    // [수정] initialSelectionRef 대신, 드래그 시작 시점의 전체 선택 상태를 담을 ref
    const selectionAtDragStartRef = useRef<Set<string>>(new Set());

    const cellToString = (cell: GridCell): string => `${cell.day}-${cell.hour}-${cell.minute}`;
    const stringToCell = (str: string): GridCell => {
        const [day, hour, minute] = str.split('-');
        return { day: day as DayOfWeek, hour: Number(hour), minute: Number(minute) };
    };

    const hours = Array.from(
        { length: (END_HOUR - START_HOUR) * (60 / TIME_SLOT_MINUTES) },
        (_, i) => {
            const totalMinutes = START_HOUR * 60 + i * TIME_SLOT_MINUTES;
            return {
                hour: Math.floor(totalMinutes / 60),
                minute: totalMinutes % 60,
            };
        }
    );

    const getCellFromCoordinates = (x: number, y: number): GridCell | null => {
        const dayIndex = Math.floor(x / DAY_COLUMN_WIDTH);
        const timeIndex = Math.floor(y / CELL_HEIGHT);

        if (dayIndex < 0 || dayIndex >= DAYS.length || timeIndex < 0 || timeIndex >= hours.length) {
            return null;
        }

        return {
            day: DAYS[dayIndex],
            hour: hours[timeIndex].hour,
            minute: hours[timeIndex].minute,
        };
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isPaintModeRef.current,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const cell = getCellFromCoordinates(locationX, locationY);
                if (!cell) return;

                startCellRef.current = cell;
                // [수정] 드래그 시작 시점의 현재 선택 상태를 저장합니다 (Stale state 방지)
                selectionAtDragStartRef.current = new Set(selectedCellsRef.current.map(cellToString));
                const cellStr = cellToString(cell);

                // 시작 셀의 상태에 따라 칠하기/지우기 모드 결정
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

                // [수정] 드래그 시작 시점의 상태를 기준으로 계산을 시작합니다.
                const newSelection = new Set(selectionAtDragStartRef.current);

                const startDayIndex = DAYS.indexOf(startCell.day);
                const currentDayIndex = DAYS.indexOf(currentCell.day);
                const minDayIndex = Math.min(startDayIndex, currentDayIndex);
                const maxDayIndex = Math.max(startDayIndex, currentDayIndex);

                const startTimeIndex = hours.findIndex(h => h.hour === startCell.hour && h.minute === startCell.minute);
                const currentTimeIndex = hours.findIndex(h => h.hour === currentCell.hour && h.minute === currentCell.minute);
                const minTimeIndex = Math.min(startTimeIndex, currentTimeIndex);
                const maxTimeIndex = Math.max(startTimeIndex, currentTimeIndex);

                for (let d = minDayIndex; d <= maxDayIndex; d++) {
                    for (let t = minTimeIndex; t <= maxTimeIndex; t++) {
                        const cellInRectStr = cellToString({ day: DAYS[d], hour: hours[t].hour, minute: hours[t].minute });
                        if (dragModeRef.current === 'paint') {
                            newSelection.add(cellInRectStr);
                        } else if (dragModeRef.current === 'erase') {
                            newSelection.delete(cellInRectStr);
                        }
                    }
                }
                setSelectedCells(Array.from(newSelection).map(stringToCell));
            },
            onPanResponderRelease: () => {
                // [수정] 드래그가 끝나면 부모를 호출하지 않고, 내부 상태만 초기화합니다.
                startCellRef.current = null;
                dragModeRef.current = null;
                selectionAtDragStartRef.current.clear();
            },
        })
    ).current;

    // [추가] '칠하기' 버튼의 동작을 수정합니다.
    const handlePaintModeToggle = () => {
        const newMode = !isPaintMode;
        // 칠하기 모드를 켤 때는 아무것도 하지 않습니다.
        setIsPaintMode(newMode);

        // 칠하기 모드를 끌 때('완료' 버튼 누를 때) 선택된 셀 정보를 부모에게 전달합니다.
        if (!newMode) {
            onSelectionComplete(selectedCellsRef.current);
        }
    };

    const isCellSelected = (day: DayOfWeek, hour: number, minute: number) => {
        return selectedCells.some(cell => cell.day === day && cell.hour === hour && cell.minute === minute);
    };

    return (
        <View style={styles.fullContainer}>
            <ScrollView style={styles.container} scrollEnabled={!isPaintMode}>
                <View style={styles.header}>
                    <View style={{ width: TIME_COLUMN_WIDTH }} />
                    {DAYS.map(day => (
                        <View key={day} style={[styles.headerCell, { width: DAY_COLUMN_WIDTH }]}>
                            <Text style={styles.headerText}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.body}>
                    <View style={styles.timeColumn}>
                        {hours.map(({ hour, minute }) => (
                            minute === 0 && (
                                <View key={`${hour}-${minute}`} style={[styles.timeCell, { height: CELL_HEIGHT * 2 }]}>
                                    <Text style={styles.timeText}>{formatTime(hour, 0)}</Text>
                                </View>
                            )
                        ))}
                    </View>
                    <View>
                        <View style={styles.gridContainer}>
                            {DAYS.map(day => (
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
                                </View>
                            ))}
                        </View>
                        {isPaintMode && <View {...panResponder.panHandlers} style={styles.gestureContainer} />}
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
    fullContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#333',
    },
    headerCell: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#333',
    },
    headerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    body: {
        flexDirection: 'row',
    },
    timeColumn: {
        width: TIME_COLUMN_WIDTH,
    },
    timeCell: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        borderRightWidth: 1,
        borderRightColor: '#333',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 10,
    },
    timeText: {
        color: '#888',
        fontSize: 12,
        position: 'relative',
        top: -8,
        backgroundColor: '#000',
        paddingHorizontal: 2,
    },
    gridContainer: {
        flexDirection: 'row',
    },
    dayColumn: {
        width: DAY_COLUMN_WIDTH,
    },
    cell: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        borderRightWidth: 1,
        borderRightColor: '#333',
    },
    selectedCell: {
        backgroundColor: 'rgba(74, 158, 255, 0.4)',
        borderColor: 'rgba(74, 158, 255, 0.8)',
        borderWidth: 0.5,
    },
    gestureContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: TOTAL_GRID_WIDTH,
        height: TOTAL_GRID_HEIGHT,
        backgroundColor: 'transparent',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#1a1a1a',
    },
    paintButton: {
        backgroundColor: '#333',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    paintButtonActive: {
        backgroundColor: '#4a9eff',
    },
    paintButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

