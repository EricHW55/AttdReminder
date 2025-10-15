import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 설정 탭을 위한 기본 화면 컴포넌트입니다.
export default function SettingsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>설정</Text>
            <Text style={styles.text}>알림, 테마 등 앱 설정을 변경하는 화면입니다.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        color: '#aaa',
    },
});
