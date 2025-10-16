import { Stack } from 'expo-router';

// 앱 전체의 네비게이션 구조를 정의합니다.
// 기본 화면(tabs)과 모달 화면들을 관리합니다.
export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
