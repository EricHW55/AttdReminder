import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Schedule, DayOfWeek } from '@/src/types/schedule';
import { DAYS, START_HOUR, END_HOUR, TIME_SLOT_MINUTES } from '@/src/constants/timeSlots';
import { formatTime, timeToMinutes } from '@/src/utils/timeHelpers';

interface TimetableGridProps {
    schedules: Schedule[];
    onSchedulePress?: (schedule: Schedule) => void; // 필요하면 (schedule, occurrence)로 확장 가능
}

const CELL_HEIGHT = 60; // 30분당 높이
const TIME_COLUMN_WIDTH = 50;
const DAY_COLUMN_WIDTH = (Dimensions.get('window').width - TIME_COLUMN_WIDTH) / DAYS.length;

export const TimetableGrid: React.FC<TimetableGridProps> = memo(({ schedules, onSchedulePress }) => {
    // 30분 단위 슬롯(배경 그리드용)
    const timeSlots = Array.from(
        { length: (END_HOUR - START_HOUR) * (60 / TIME_SLOT_MINUTES) },
        (_, i) => {
            const totalMinutes = START_HOUR * 60 + i * TIME_SLOT_MINUTES;
            return {
                hour: Math.floor(totalMinutes / 60),
                minute: totalMinutes % 60,
            };
        }
    );

    // 시간 레이블(1시간 단위)
    const displayHours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    // 변경 포인트: 특정 day에 대해 schedule의 occurrences 중 day가 일치하는 것만 렌더
    const renderScheduleForDay = (schedule: Schedule, day: DayOfWeek) => {
        const dayOccurrences = schedule.occurrences?.filter(o => o.day === day) ?? [];
        if (dayOccurrences.length === 0) return null;

        return dayOccurrences.map((occ, idx) => {
            const { startHour, startMinute, endHour, endMinute } = occ.timeSlot;

            const startTotalMinutes = timeToMinutes(startHour, startMinute);
            const endTotalMinutes = timeToMinutes(endHour, endMinute);

            const top = ((startTotalMinutes - START_HOUR * 60) / TIME_SLOT_MINUTES) * CELL_HEIGHT;
            const height = ((endTotalMinutes - startTotalMinutes) / TIME_SLOT_MINUTES) * CELL_HEIGHT;

            // 그리드 범위를 벗어나는 occurrence는 스킵
            if (top < 0 || top + height > timeSlots.length * CELL_HEIGHT) return null;

            return (
                <TouchableOpacity
                    key={`${schedule.id}-${day}-${startHour}-${startMinute}-${endHour}-${endMinute}-${idx}`}
                    style={[styles.scheduleBlock, { top, height, backgroundColor: schedule.color }]}
                    onPress={() => onSchedulePress?.(schedule)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.scheduleText} numberOfLines={2}>{schedule.name}</Text>
                    {schedule.room && <Text style={styles.scheduleRoomText}>{schedule.room}</Text>}
                </TouchableOpacity>
            );
        });
    };

    return (
        <ScrollView style={styles.container}>
            {/* 헤더: 요일 */}
            <View style={styles.header}>
                <View style={{ width: TIME_COLUMN_WIDTH }} />
                {DAYS.map(day => (
                    <View key={`hdr-${day}`} style={[styles.headerCell, { width: DAY_COLUMN_WIDTH }]}>
                        <Text style={styles.headerText}>{day}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.body}>
                {/* 좌측 시간 레일 */}
                <View style={styles.timeColumn}>
                    {displayHours.map(hour => (
                        <View
                            key={`time-${hour}`}
                            style={[styles.timeCell, { height: CELL_HEIGHT * (60 / TIME_SLOT_MINUTES) }]}
                        >
                            <Text style={styles.timeText}>{formatTime(hour, 0)}</Text>
                        </View>
                    ))}
                </View>

                {/* 요일별 컬럼 */}
                {DAYS.map(day => (
                    <View key={`col-${day}`} style={[styles.dayColumn, { width: DAY_COLUMN_WIDTH }]}>
                        {/* 배경 그리드(30분 단위) */}
                        {timeSlots.map(({ hour, minute }) => (
                            <View
                                key={`bg-${day}-${hour}-${minute}`}
                                style={[styles.cell, { height: CELL_HEIGHT }]}
                            />
                        ))}

                        {/* 스케줄 블록(occurrences 기반) */}
                        {schedules.map(schedule => renderScheduleForDay(schedule, day))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#333' },
    headerCell: { height: 40, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#333' },
    headerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    body: { flexDirection: 'row' },
    timeColumn: { width: TIME_COLUMN_WIDTH },
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
        borderColor: 'rgba(0,0,0,0.1)',
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
