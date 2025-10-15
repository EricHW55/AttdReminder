// src/features/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Schedule, DayOfWeek } from '../../types/schedule';

// ───────────────────────────────────────────────────────────────────────────────
// 포그라운드 때도 무음 배너로 보이게 설정
// (당신 프로젝트의 expo-notifications 타입에 맞춰 banner/list 필드 포함)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// '월'~'일' → Expo weekday(1=일 ~ 7=토)
function toExpoWeekday(kr: DayOfWeek): number | null {
    const map: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];
    const idx = map.indexOf(kr);
    return idx === -1 ? null : idx + 1;
}

// 안드로이드 무음 채널 보장
async function ensureAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('classes', {
        name: 'Class Reminders',
        importance: Notifications.AndroidImportance.HIGH, // 배너 원하면 HIGH
        // sound를 지정하지 않으면 대부분 무음 채널로 동작 (기기 설정 우선)
        vibrationPattern: [], // 진동 끄고 싶으면 빈 배열
    });
}

export const notificationService = {
    // 권한 요청(무음 기준)
    async requestPermissions(): Promise<boolean> {
        const res = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: false,
                allowSound: false,
                // allowAnnouncements: false, // ← 당신 버전에 없는 필드이므로 제거
            },
        });
        await ensureAndroidChannel();
        return res.granted || res.status === 'granted';
    },

    // 주간 반복 알림 예약
    async scheduleNotification(schedule: Schedule): Promise<void> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.warn('알림 권한이 허용되지 않았습니다.');
            return;
        }

        // 동일 스케줄에 잡혀 있던 예약 제거
        await this.cancelScheduleNotifications(schedule.id);

        for (const day of schedule.days) {
            for (const notification of schedule.notifications) {
                if (!notification.enabled) continue;

                const weekday = toExpoWeekday(day);
                if (weekday === null) continue; // (일=1) 포함하도록 null 체크

                const startMinutes =
                    schedule.timeSlot.startHour * 60 + schedule.timeSlot.startMinute;

                let triggerMinutes =
                    notification.type === 'before'
                        ? startMinutes - notification.minutes
                        : startMinutes + notification.minutes;

                // 하루 범위를 넘어가면 간단 보정(필요하면 더 정밀하게)
                if (triggerMinutes < 0) triggerMinutes = 0;
                if (triggerMinutes >= 24 * 60) triggerMinutes = 24 * 60 - 1;

                const triggerHour = Math.floor(triggerMinutes / 60);
                const triggerMinute = triggerMinutes % 60;

                // // 당신 환경에선 enum 대신 문자열 'calendar' 사용이 안전
                // const trigger: Notifications.CalendarTriggerInput = {
                //     weekday,           // 1(일)~7(토)
                //     hour: triggerHour,
                //     minute: triggerMinute,
                //     repeats: true,     // 매주 반복
                //     // 일부 버전에선 trigger.channelId가 없을 수 있어요.
                //     // 타입 에러가 난다면 아래 줄을 지워도 됩니다(채널은 setNotificationChannelAsync로 지정).
                //     channelId: Platform.OS === 'android' ? 'classes' : undefined,
                // };

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: schedule.name,
                        body:
                            notification.type === 'before'
                                ? `${notification.minutes}분 후 수업이 시작됩니다${schedule.room ? ` (${schedule.room})` : ''}`
                                : `수업 시작 ${Math.abs(notification.minutes)}분 경과`,
                        sound: false, // null 대신 false (타입 호환)
                        // 커스텀 identifier 대신 data에 심어서 나중에 취소 시 사용
                        data: { scheduleId: schedule.id, day, nid: notification.id },
                    },
                    trigger: {
                        weekday,           // 1(일)~7(토)
                        hour: triggerHour,
                        minute: triggerMinute,
                        repeats: true,     // 매주 반복
                        channelId: 'classes', // 안드로이드 채널 ID 지정
                    },
                });
            }
        }
    },

    // 특정 스케줄 ID로 예약된 알림 모두 취소
    async cancelScheduleNotifications(scheduleId: string): Promise<void> {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        // content.data.scheduleId로 필터(커스텀 identifier 미사용 대응)
        const ids = (all as Notifications.NotificationRequest[])
            .filter((req) => (req as any)?.content?.data?.scheduleId === scheduleId)
            .map((req) => req.identifier);

        for (const id of ids) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    },
};
