import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

// 경로는 기존과 동일
import { TimetableGrid } from '@/src/components/timetable/TimetableGrid';
import { ScheduleFormModal } from '@/src/components/schedule/ScheduleFormModal';
import { DragScheduleModal } from '@/src/components/schedule/DragScheduleModal';
import { Schedule } from '@/src/types/schedule';
import { scheduleStorage } from '@/src/features/schedule/scheduleStorage';
import { notificationService } from '@/src/features/notifications/notificationService';

export default function HomeScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [dragModalVisible, setDragModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  // [수정] isInitialLoading으로 이름을 변경하여 초기 로딩만 관리하도록 명확화
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 로컬 id 생성기 (충분히 유니크)
  const genId = () =>
      `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const loadSchedules = useCallback(async () => {
    try {
      const storedSchedules = await scheduleStorage.getAll();
      setSchedules(storedSchedules);
      // 첫 로드 시에만 권한 요청
      if (isInitialLoading) {
        await notificationService.requestPermissions();
      }
    } catch (error) {
      Alert.alert('오류', '시간표를 불러오는 데 실패했습니다.');
    } finally {
      // [수정] 첫 로딩이 끝나면 더 이상 전체 로딩 화면을 보여주지 않음
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    }
  }, [isInitialLoading]);

  useFocusEffect(
      useCallback(() => {
        loadSchedules();
      }, [loadSchedules]),
  );

  // 추가/수정 공용 처리
  const handleScheduleSubmit = async (scheduleData: Omit<Schedule, 'id'> | Schedule) => {
    try {
      let updatedSchedule: Schedule;

      if ('id' in scheduleData) {
        // 수정
        await scheduleStorage.update(scheduleData.id, scheduleData);
        updatedSchedule = scheduleData;
        Alert.alert('성공', '수업 정보가 수정되었습니다.');
      } else {
        // 추가: 로컬에서 id 생성해 Schedule로 변환
        const schedule: Schedule = { id: genId(), ...scheduleData };
        await scheduleStorage.add(schedule); // add가 void여도 OK
        updatedSchedule = schedule;
        Alert.alert('성공', '새로운 수업이 시간표에 추가되었습니다.');
      }

      // 알림 재예약
      await notificationService.scheduleNotification(updatedSchedule);

      closeAllModals();
      // [수정] 로딩 상태를 변경하지 않고 바로 데이터를 다시 불러와서 깜빡임 제거
      const updatedSchedules = await scheduleStorage.getAll();
      setSchedules(updatedSchedules);
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleScheduleDelete = async (scheduleId: string) => {
    Alert.alert('삭제 확인', '이 수업을 정말로 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await scheduleStorage.delete(scheduleId);
            await notificationService.cancelScheduleNotifications(scheduleId);
            closeAllModals();
            // [수정] 로딩 상태를 변경하지 않고 데이터를 다시 불러옴
            const updatedSchedules = await scheduleStorage.getAll();
            setSchedules(updatedSchedules);
            Alert.alert('성공', '수업이 삭제되었습니다.');
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleSchedulePress = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormModalVisible(true);
  };

  const handleOpenAddOptions = () => {
    const options = ['직접 추가', '드래그하여 추가', '취소'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: 2, title: '시간표 추가 방식 선택' },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              setSelectedSchedule(null);
              setFormModalVisible(true);
            } else if (buttonIndex === 1) {
              setDragModalVisible(true);
            }
          },
      );
    } else {
      Alert.alert('시간표 추가', '어떤 방식으로 추가하시겠습니까?', [
        { text: '직접 추가', onPress: () => { setSelectedSchedule(null); setFormModalVisible(true); } },
        { text: '드래그하여 추가', onPress: () => setDragModalVisible(true) },
        { text: '취소', style: 'cancel' },
      ]);
    }
  };

  const closeAllModals = () => {
    setFormModalVisible(false);
    setDragModalVisible(false);
    setSelectedSchedule(null);
  };

  // [수정] isInitialLoading 상태를 사용하여 첫 로딩 시에만 로딩 화면을 보여줌
  if (isInitialLoading) {
    return (
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            출석 찍었어?
          </Text>
        </View>

        <StatusBar barStyle="light-content" />

        <TimetableGrid schedules={schedules} onSchedulePress={handleSchedulePress} />

        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddOptions}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <ScheduleFormModal
            visible={formModalVisible}
            onClose={closeAllModals}
            onSubmit={handleScheduleSubmit}
            onDelete={handleScheduleDelete}
            // Schedule | null → Partial<Schedule> | undefined 로 맞춰 전달
            initialSchedule={(selectedSchedule ?? undefined) as Partial<Schedule> | undefined}
        />

        <DragScheduleModal
            visible={dragModalVisible}
            onClose={closeAllModals}
            onSubmit={handleScheduleSubmit}
            existingSchedules={schedules}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center', // 중앙 정렬
    alignItems: 'center',
    paddingVertical: 5, // 위아래 패딩 추가
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center', // 텍스트 중앙 정렬
    marginHorizontal: 20, // 양쪽 마진 추가 (텍스트와 화면의 간격)
    marginTop: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 36,
  },
});
