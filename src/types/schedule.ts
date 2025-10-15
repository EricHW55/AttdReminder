export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface TimeSlot {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
}

// 요일과 시간 정보를 한 쌍으로 묶는 새로운 인터페이스
export interface ScheduleOccurrence {
    day: DayOfWeek;
    timeSlot: TimeSlot;
}
export interface Schedule {
    id: string;
    name: string;
    room?: string;
    // occurrences 배열로 시간 정보를 통합 관리
    occurrences: ScheduleOccurrence[];
    color: string;
    notifications: NotificationSetting[];
}

export interface NotificationSetting {
    id: string;
    type: 'before' | 'after';
    minutes: number;
    enabled: boolean;
}

export interface GridCell {
    day: DayOfWeek;
    hour: number;
    minute: number;
}