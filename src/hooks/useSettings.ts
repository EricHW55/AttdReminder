import { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { settingsStorage } from '../features/settings/settingsStorage';
import { DayOfWeek } from '../types/schedule';

export const useSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const loadSettings = async () => {
        try {
            const loadedSettings = await settingsStorage.get();
            setSettings(loadedSettings);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const getDays = (): DayOfWeek[] => {
        const days: DayOfWeek[] = ['월', '화', '수', '목', '금'];
        if (settings.includeSaturday) days.push('토');
        if (settings.includeSunday) days.push('일');
        return days;
    };

    return {
        settings,
        loading,
        reload: loadSettings,
        days: getDays(),
        startHour: settings.startHour,
        endHour: settings.endHour,
        timeSlotMinutes: settings.timeSlotMinutes,
    };
};