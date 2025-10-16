// src/features/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Schedule, DayOfWeek } from '../../types/schedule';

// 포그라운드에서도 무음 배너로 표시
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
        vibrationPattern: [], // 진동 끄려면 빈 배열
        // sound를 지정하지 않으면 기기 설정에 따라 무음 채널로 동작
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
            },
        });
        await ensureAndroidChannel();
        return res.granted || res.status === 'granted';
    },

    // 주간 반복 알림 예약 (occurrences 기반)
    async scheduleNotification(schedule: Schedule): Promise<void> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.warn('알림 권한이 허용되지 않았습니다.');
            return;
        }

        // 동일 스케줄로 잡혀있던 예약 제거
        await this.cancelScheduleNotifications(schedule.id);

        for (const occ of schedule.occurrences ?? []) {
            const weekday = toExpoWeekday(occ.day);
            if (weekday === null) continue;

            const startMinutes = occ.timeSlot.startHour * 60 + occ.timeSlot.startMinute;

            for (const notification of schedule.notifications) {
                if (!notification.enabled) continue;

                let triggerMinutes =
                    notification.type === 'before'
                        ? startMinutes - notification.minutes
                        : startMinutes + notification.minutes;

                // 하루 범위 보정
                if (triggerMinutes < 0) triggerMinutes = 0;  // 0시 이전으로 가면 0시로 맞추기
                if (triggerMinutes >= 24 * 60) triggerMinutes = 24 * 60 - 1; // 24시 이후로 가면 23:59로 맞추기

                const triggerHour = Math.floor(triggerMinutes / 60);
                const triggerMinute = triggerMinutes % 60;

                // ✅ 주간 반복 트리거(안드로이드/ios 공통). type 넣지 마세요!
                const trigger = {
                    weekday,                 // 1(일) ~ 7(토)
                    hour: triggerHour,
                    minute: triggerMinute,
                    repeats: true,
                    ...(Platform.OS === 'android' ? { channelId: 'classes' } : {}),
                } as unknown as Notifications.NotificationTriggerInput;

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: schedule.name,
                        body:
                            notification.type === 'before'
                                ? `${notification.minutes}분 후 수업이 시작됩니다${schedule.room ? ` (${schedule.room})` : ''}`
                                : `수업 시작 ${Math.abs(notification.minutes)}분 경과`,
                        sound: false, // 무음
                        // identifier 대신 data에 식별자 삽입(취소 시 사용)
                        data: {
                            scheduleId: schedule.id,
                            day: occ.day,
                            nid: notification.id,
                            startHour: occ.timeSlot.startHour,
                            startMinute: occ.timeSlot.startMinute,
                        },
                    },
                    trigger,
                });
            }
        }
    },

    // 특정 스케줄 ID로 예약된 알림 모두 취소
    async cancelScheduleNotifications(scheduleId: string): Promise<void> {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        const ids = (all as Notifications.NotificationRequest[])
            .filter((req) => (req as any)?.content?.data?.scheduleId === scheduleId)
            .map((req) => req.identifier);

        for (const id of ids) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    },
};
