import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 하단 탭 메뉴의 구조와 아이콘을 설정합니다.
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#4a9eff',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    backgroundColor: '#1a1a1a',
                    borderTopColor: '#333',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '시간표',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="grid" color={color} />,
                }}
            />
            {/* 나중에 설정 등 다른 탭을 추가할 수 있습니다. */}
            <Tabs.Screen
                name="settings"
                options={{
                    title: '설정',
                    tabBarIcon: ({ color }) => <Ionicons size={28} name="settings" color={color} />,
                }}
            />
        </Tabs>
    );
}
