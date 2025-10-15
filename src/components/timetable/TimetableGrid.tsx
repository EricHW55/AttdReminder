import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Schedule, DayOfWeek } from '../../types/schedule';
import { DAYS, START_HOUR, END_HOUR, TIME_SLOT_MINUTES } from '../../constants/timeSlots';
import { formatTime, timeToMinutes } from '../../utils/timeHelpers';

interface TimetableGridProps {
    schedules: Schedule[];
    // [수정] 기존 스케줄을 눌렀을 때 호출될 함수 prop 추가
    onSchedulePress?: (schedule: Schedule) => void;
}

const CELL_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 50;
const DAY_COLUMN_WIDTH = (Dimensions.get('window').width - TIME_COLUMN_WIDTH) / DAYS.length;

export const TimetableGrid: React.FC<TimetableGridProps> = ({ schedules, onSchedulePress }) => {
    // ... (기존 hours 배열 생성 로직은 동일)
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

    const renderSchedule = (schedule: Schedule, day: DayOfWeek) => {
        if (!schedule.days.includes(day)) return null;

        const startTotalMinutes = timeToMinutes(schedule.timeSlot.startHour, schedule.timeSlot.startMinute);
        const endTotalMinutes = timeToMinutes(schedule.timeSlot.endHour, schedule.timeSlot.endMinute);

        const top = ((startTotalMinutes - START_HOUR * 60) / TIME_SLOT_MINUTES) * CELL_HEIGHT;
        const height = ((endTotalMinutes - startTotalMinutes) / TIME_SLOT_MINUTES) * CELL_HEIGHT;

        return (
            // [수정] TouchableOpacity로 감싸서 누를 수 있게 만듦
            <TouchableOpacity
                key={schedule.id + day}
                style={[
                    styles.scheduleBlock,
                    { top, height, backgroundColor: schedule.color },
                ]}
                onPress={() => onSchedulePress?.(schedule)}
            >
                <Text style={styles.scheduleText} numberOfLines={2}>{schedule.name}</Text>
                {schedule.room && <Text style={styles.scheduleRoomText}>{schedule.room}</Text>}
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView style={styles.container}>
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
                    {hours.map(({ hour }) => (
                        <View key={hour} style={[styles.timeCell, { height: CELL_HEIGHT * (60 / TIME_SLOT_MINUTES) }]}>
                            <Text style={styles.timeText}>{formatTime(hour, 0)}</Text>
                        </View>
                    ))}
                </View>
                {DAYS.map(day => (
                    <View key={day} style={[styles.dayColumn, { width: DAY_COLUMN_WIDTH }]}>
                        {hours.map(({ hour, minute }) => (
                            <View key={`${hour}-${minute}`} style={[styles.cell, { height: CELL_HEIGHT }]} />
                        ))}
                        {schedules.map(schedule => renderSchedule(schedule, day))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // ... (기존 스타일 코드와 거의 동일, 아래 schedule 스타일 추가/수정)
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#333' },
    headerCell: { height: 40, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#333' },
    headerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    body: { flexDirection: 'row' },
    timeColumn: { width: TIME_COLUMN_WIDTH },
    timeCell: { borderBottomWidth: 1, borderBottomColor: '#333', borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 },
    timeText: { color: '#888', fontSize: 12, position: 'relative', top: -8 },
    dayColumn: { position: 'relative' },
    cell: { borderBottomWidth: 1, borderBottomColor: '#333', borderRightWidth: 1, borderRightColor: '#333' },
    scheduleBlock: {
        position: 'absolute',
        left: '2%',
        right: '2%',
        borderRadius: 8,
        padding: 6,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
    },
    scheduleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    scheduleRoomText: {
        color: 'white',
        fontSize: 10,
        opacity: 0.8,
        textAlign: 'right',
    },
});