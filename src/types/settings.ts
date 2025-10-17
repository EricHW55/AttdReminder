export interface AppSettings {
    // 시간표 설정
    startHour: number;
    endHour: number;
    timeSlotMinutes: number;
    includeSaturday: boolean;
    includeSunday: boolean;

    // 알림 설정
    notificationSound: boolean;
    notificationVibration: boolean;
    notificationBanner: boolean;
    notificationBadge: boolean;

    // 기본 알림 시간 (새 수업 추가 시 기본값)
    defaultNotificationMinutes: number[];
}

export const DEFAULT_SETTINGS: AppSettings = {
    startHour: 9,
    endHour: 19,
    timeSlotMinutes: 30,
    includeSaturday: false,
    includeSunday: false,

    notificationSound: true,
    notificationVibration: true,
    notificationBanner: true,
    notificationBadge: true,

    defaultNotificationMinutes: [5, -5], // 5분 전, 5분 후
};