import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    PanResponder,
    GestureResponderEvent,
} from 'react-native';
import { DayOfWeek, GridCell } from '../../types/schedule';
import { DAYS, START_HOUR, END_HOUR, TIME_SLOT_MINUTES } from '../../constants/timeSlots';
import { formatTime } from '../../utils/timeHelpers';

interface DraggableTimetableProps {
    onSelectionComplete: (cells: GridCell[]) => void;
}

const CELL_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 50;
const DAY_COLUMN_WIDTH = (Dimensions.get('window').width - TIME_COLUMN_WIDTH) / DAYS.length;

export const DraggableTimetable: React.FC<DraggableTimetableProps> = ({
                                                                          onSelectionComplete,
                                                                      }) => {
    const [selectedCells, setSelectedCells] = useState<GridCell[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [startCell, setStartCell] = useState<GridCell | null>(null);

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

    const getCellFromPosition = (x: number, y: number): GridCell | null => {
        const dayIndex = Math.floor((x - TIME_COLUMN_WIDTH) / DAY_COLUMN_WIDTH);
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

    const getCellsBetween = (start: GridCell, end: GridCell): GridCell[] => {
        const cells: GridCell[] = [];

        const startDayIndex = DAYS.indexOf(start.day);
        const endDayIndex = DAYS.indexOf(end.day);

        const startTimeIndex = hours.findIndex(
            h => h.hour === start.hour && h.minute === start.minute
        );
        const endTimeIndex = hours.findIndex(
            h => h.hour === end.hour && h.minute === end.minute
        );

        const minDay = Math.min(startDayIndex, endDayIndex);
        const maxDay = Math.max(startDayIndex, endDayIndex);
        const minTime = Math.min(startTimeIndex, endTimeIndex);
        const maxTime = Math.max(startTimeIndex, endTimeIndex);

        for (let d = minDay; d <= maxDay; d++) {
            for (let t = minTime; t <= maxTime; t++) {
                cells.push({
                    day: DAYS[d],
                    hour: hours[t].hour,
                    minute: hours[t].minute,
                });
            }
        }

        return cells;
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt: GestureResponderEvent) => {
            const { locationX, locationY } = evt.nativeEvent;
            const cell = getCellFromPosition(locationX, locationY);

            if (cell) {
                setIsDragging(true);
                setStartCell(cell);
                setSelectedCells([cell]);
            }
        },

        onPanResponderMove: (evt: GestureResponderEvent) => {
            if (!isDragging || !startCell) return;

            const { locationX, locationY } = evt.nativeEvent;
            const currentCell = getCellFromPosition(locationX, locationY);

            if (currentCell) {
                const cells = getCellsBetween(startCell, currentCell);
                setSelectedCells(cells);
            }
        },

        onPanResponderRelease: () => {
            setIsDragging(false);
            if (selectedCells.length > 0) {
                onSelectionComplete(selectedCells);
            }
            setStartCell(null);
        },
    });

    const isCellSelected = (day: DayOfWeek, hour: number, minute: number): boolean => {
        return selectedCells.some(
            cell => cell.day === day && cell.hour === hour && cell.minute === minute
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.headerCell, { width: TIME_COLUMN_WIDTH }]} />
                {DAYS.map(day => (
                    <View key={day} style={[styles.headerCell, { width: DAY_COLUMN_WIDTH }]}>
                        <Text style={styles.headerText}>{day}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.body} {...panResponder.panHandlers}>
                <View style={styles.timeColumn}>
                    {hours.map(({ hour, minute }) => (
                        <View key={`${hour}-${minute}`} style={[styles.timeCell, { height: CELL_HEIGHT }]}>
                            {minute === 0 && (
                                <Text style={styles.timeText}>{formatTime(hour, minute)}</Text>
                            )}
                        </View>
                    ))}
                </View>

                {DAYS.map(day => (
                    <View key={day} style={styles.dayColumn}>
                        {hours.map(({ hour, minute }) => {
                            const selected = isCellSelected(day, hour, minute);

                            return (
                                <View
                                    key={`${day}-${hour}-${minute}`}
                                    style={[
                                        styles.cell,
                                        { height: CELL_HEIGHT },
                                        selected && styles.selectedCell,
                                    ]}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>

            {selectedCells.length > 0 && (
                <View style={styles.hint}>
                    <Text style={styles.hintText}>
                        선택된 시간: {selectedCells.length}개 셀
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        color: '#888',
        fontSize: 12,
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
        backgroundColor: 'rgba(74, 158, 255, 0.5)',
    },
    hint: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    hintText: {
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
});