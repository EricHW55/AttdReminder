import { DayOfWeek } from '../types/schedule';
import { settingsStorage } from '../features/settings/settingsStorage';

// 기본값 (설정을 불러오기 전 사용)
export const DEFAULT_START_HOUR = 9;
export const DEFAULT_END_HOUR = 19;
export const DEFAULT_TIME_SLOT_MINUTES = 30;
export const DEFAULT_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금'];

// 동적으로 설정값을 불러오는 함수들
export async function getStartHour(): Promise<number> {
    const settings = await settingsStorage.get();
    return settings.startHour;
}

export async function getEndHour(): Promise<number> {
    const settings = await settingsStorage.get();
    return settings.endHour;
}

export async function getTimeSlotMinutes(): Promise<number> {
    const settings = await settingsStorage.get();
    return settings.timeSlotMinutes;
}

export async function getDays(): Promise<DayOfWeek[]> {
    const settings = await settingsStorage.get();
    const days: DayOfWeek[] = ['월', '화', '수', '목', '금'];

    if (settings.includeSaturday) {
        days.push('토');
    }
    if (settings.includeSunday) {
        days.push('일');
    }

    return days;
}

// 즉시 사용 가능한 기본값 (컴포넌트 초기 렌더링용)
export let START_HOUR = DEFAULT_START_HOUR;
export let END_HOUR = DEFAULT_END_HOUR;
export let TIME_SLOT_MINUTES = DEFAULT_TIME_SLOT_MINUTES;
export let DAYS: DayOfWeek[] = DEFAULT_DAYS;

// 설정값을 전역 변수에 로드하는 함수 (앱 시작 시 호출)
export async function loadTimeSlotSettings(): Promise<void> {
    const settings = await settingsStorage.get();
    START_HOUR = settings.startHour;
    END_HOUR = settings.endHour;
    TIME_SLOT_MINUTES = settings.timeSlotMinutes;

    DAYS = ['월', '화', '수', '목', '금'];
    if (settings.includeSaturday) DAYS.push('토');
    if (settings.includeSunday) DAYS.push('일');
}

export const COLORS = [
    '#FF9999', // 연한 빨강
    '#99D9EA', // 연한 청록
    '#B4A7D6', // 연한 보라
    '#FFB366', // 연한 주황
    '#87CEEB', // 하늘색
    '#F0E68C', // 연한 노랑
    '#98D8C8', // 민트
    '#FFB6C1', // 연한 분홍
    '#DDA0DD', // 자주색
    '#98FB98', // 연한 초록
];

export const NOTIFICATION_OPTIONS = [
    { label: '10분 전', value: 10 },
    { label: '15분 전', value: 15 },
    { label: '30분 전', value: 30 },
    { label: '1시간 전', value: 60 },
    { label: '수업 시작 시', value: 0 },
    { label: '5분 후', value: -5 },
    { label: '10분 후', value: -10 },
];