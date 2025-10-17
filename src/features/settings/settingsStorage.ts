import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../../types/settings';

const STORAGE_KEY = '@app_settings';

export const settingsStorage = {
    /**
     * 저장된 설정 불러오기
     * 저장된 설정이 없으면 기본값 반환
     */
    async get(): Promise<AppSettings> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // 기본 설정과 병합하여 누락된 필드 방지
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return DEFAULT_SETTINGS;
        }
    },

    /**
     * 설정 전체 저장
     */
    async save(settings: AppSettings): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },

    /**
     * 설정 부분 업데이트
     * 기존 설정과 병합하여 저장
     */
    async update(updates: Partial<AppSettings>): Promise<AppSettings> {
        try {
            const current = await this.get();
            const updated = { ...current, ...updates };
            await this.save(updated);
            return updated;
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    },

    /**
     * 설정 초기화
     * 모든 설정을 기본값으로 되돌림
     */
    async reset(): Promise<void> {
        try {
            await this.save(DEFAULT_SETTINGS);
        } catch (error) {
            console.error('Failed to reset settings:', error);
            throw error;
        }
    },

    /**
     * 특정 키의 값만 가져오기
     */
    async getValue<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
        const settings = await this.get();
        return settings[key];
    },

    /**
     * 특정 키의 값만 업데이트
     */
    async setValue<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<void> {
        await this.update({ [key]: value } as Partial<AppSettings>);
    },
};