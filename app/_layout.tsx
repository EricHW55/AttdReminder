import React, { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { loadTimeSlotSettings } from '@/src/constants/timeSlots';
import { notificationService } from '@/src/features/notifications/notificationService';
import {SettingsProvider} from "@/src/contexts/SettingsContext";

// 스플래시 스크린이 자동으로 사라지는 것을 방지합니다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    // 컴포넌트가 마운트되면 앱 설정을 불러오고 스플래시 스크린을 숨깁니다.
    useEffect(() => {
        loadTimeSlotSettings().then(() => {
            SplashScreen.hideAsync();
        });
    }, []);

    // 알림 리스너 설정
    useEffect(() => {
        notificationService.requestPermissions();

        // 알림이 수신되었을 때 (앱이 켜져있을 때)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('📬 알림 수신:', notification.request.content.title);
        });

        // 사용자가 알림을 탭했을 때
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('👆 알림 탭:', response.notification.request.content.title);
        });

        // 컴포넌트가 사라질 때 리스너를 정리합니다.
        return () => {
            if (notificationListener.current) {
                // ✅ 이 부분을 수정했습니다.
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                // ✅ 이 부분을 수정했습니다.
                responseListener.current.remove();
            }
        };
    }, []);

    return (
        <SettingsProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </ThemeProvider>
        </SettingsProvider>
    );
}