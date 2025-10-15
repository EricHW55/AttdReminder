import { TimeSlot } from '../types/schedule';

export const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const formatTimeSlot = (timeSlot: TimeSlot): string => {
    return `${formatTime(timeSlot.startHour, timeSlot.startMinute)} - ${formatTime(timeSlot.endHour, timeSlot.endMinute)}`;
};

export const getTimeSlotDuration = (timeSlot: TimeSlot): number => {
    const startMinutes = timeSlot.startHour * 60 + timeSlot.startMinute;
    const endMinutes = timeSlot.endHour * 60 + timeSlot.endMinute;
    return endMinutes - startMinutes;
};

export const timeToMinutes = (hour: number, minute: number): number => {
    return hour * 60 + minute;
};

export const minutesToTime = (minutes: number): { hour: number; minute: number } => {
    return {
        hour: Math.floor(minutes / 60),
        minute: minutes % 60,
    };
};