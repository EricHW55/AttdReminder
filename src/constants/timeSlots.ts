import { DayOfWeek } from '../types/schedule';

export const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금'];

export const START_HOUR = 9;
export const END_HOUR = 18;
export const TIME_SLOT_MINUTES = 30; // 30분 단위

export const COLORS = [
    '#FF9999', // 연한 빨강 (기계학습)
    '#99D9EA', // 연한 청록 (오픈소스)
    '#B4A7D6', // 연한 보라 (알고리즘)
    '#FFB366', // 연한 주황 (선형대수)
    '#87CEEB', // 하늘색 (컴퓨터네트워크)
    '#F0E68C', // 연한 노랑 (서양음악사)
    '#98D8C8', // 민트 (시스템프로그래밍)
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