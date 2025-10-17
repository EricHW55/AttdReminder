import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/src/types/settings';
import { settingsStorage } from '@/src/features/settings/settingsStorage';
import { DayOfWeek } from '@/src/types/schedule';

// Context가 제공할 값들의 타입을 정의합니다.
interface SettingsContextType {
    settings: AppSettings;
    loading: boolean;
    days: DayOfWeek[];
    updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

// Context를 생성합니다.
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 앱 전체를 감싸서 설정 상태를 제공할 Provider 컴포넌트입니다.
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    // 설정을 불러오는 함수
    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const loadedSettings = await settingsStorage.get();
            setSettings(loadedSettings);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 설정을 업데이트하고 저장하는 함수
    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        const updated = await settingsStorage.update(newSettings);
        setSettings(updated); // 상태를 업데이트하여 모든 화면에 변경사항을 전파합니다.
    };

    // 앱 시작 시 설정을 불러옵니다.
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // 설정에 따라 동적으로 요일 배열을 계산합니다.
    const days: DayOfWeek[] = ['월', '화', '수', '목', '금'];
    if (settings.includeSaturday) days.push('토');
    if (settings.includeSunday) days.push('일');

    return (
        <SettingsContext.Provider value={{ settings, loading, days, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

// 각 컴포넌트에서 설정을 쉽게 사용하기 위한 커스텀 훅입니다.
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    // 자주 사용하는 값들을 바로 꺼내 쓸 수 있도록 추가합니다.
    const { settings, ...rest } = context;
    return {
        ...rest,
        settings,
        startHour: settings.startHour,
        endHour: settings.endHour,
        timeSlotMinutes: settings.timeSlotMinutes,
    };
};
