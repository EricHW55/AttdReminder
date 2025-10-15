import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule } from '../../types/schedule';

const STORAGE_KEY = '@timetable_schedules';

export const scheduleStorage = {
    async getAll(): Promise<Schedule[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load schedules:', error);
            return [];
        }
    },

    async save(schedules: Schedule[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
        } catch (error) {
            console.error('Failed to save schedules:', error);
            throw error;
        }
    },

    async add(schedule: Schedule): Promise<void> {
        const schedules = await this.getAll();
        schedules.push(schedule);
        await this.save(schedules);
    },

    async update(id: string, updates: Partial<Schedule>): Promise<void> {
        const schedules = await this.getAll();
        const index = schedules.findIndex(s => s.id === id);
        if (index !== -1) {
            schedules[index] = { ...schedules[index], ...updates };
            await this.save(schedules);
        }
    },

    async delete(id: string): Promise<void> {
        const schedules = await this.getAll();
        const filtered = schedules.filter(s => s.id !== id);
        await this.save(filtered);
    },
};