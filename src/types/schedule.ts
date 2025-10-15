export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface TimeSlot {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
}

export interface Schedule {
    id: string;
    name: string;
    room?: string;
    days: DayOfWeek[];
    timeSlot: TimeSlot;
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