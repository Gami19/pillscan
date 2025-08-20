// app/(tabs)/two.tsx の修正版
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicationRecordService } from '@/lib/medication-record';
import { PillSpeech } from '@/lib/speech';
import { format, isToday, isYesterday } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function HistoryScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      
      const [todayData, allData] = await Promise.all([
        MedicationRecordService.getTodayRecords(),
        MedicationRecordService.getRecentRecords(30)
      ]);

      setTodayRecords(todayData);
      setRecords(allData);
      
      console.log('📋 履歴取得完了:', {
        today: todayData.length,
        total: allData.length
      });

    } catch (error) {
      console.error('❌ 履歴取得エラー:', error);
      Alert.alert('エラー', '履歴の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return `今日 ${format(date, 'HH:mm', { locale: ja })}`;
    } else if (isYesterday(date)) {
      return `昨日 ${format(date, 'HH:mm', { locale: ja })}`;
    } else {
      return format(date, 'M月d日 HH:mm', { locale: ja });
    }
  };

  // ✅ 修正：確実に存在するアイコン名のみ使用
  const getTimePeriodIcon = (
    timePeriod: string
  ): keyof typeof Ionicons.glyphMap => {
    const icons = {
      morning: 'sunny',
      afternoon: 'cloudy',
      evening: 'moon',
      night: 'moon',
    } as const;
    return icons[timePeriod as keyof typeof icons] || 'time';
  };

  const getTimePeriodColor = (timePeriod: string) => {
    const colors = {
      morning: '#FF9500',   // オレンジ
      afternoon: '#007AFF', // 青
      evening: '#FF3B30',   // 赤
      night: '#5E5CE6'      // 紫
    };
    return colors[timePeriod as keyof typeof colors] || '#6C757D';
  };

  const handleRecordPress = (record: any) => {
    const speechText = `${record.pill_name}、${MedicationRecordService.getTimePeriodLabel(record.time_period)}に服薬済み`;
    
    Alert.alert(
      '服薬記録詳細',
      `薬剤名: ${record.pill_name}\n時間帯: ${MedicationRecordService.getTimePeriodLabel(record.time_period)}\n日時: ${formatDate(record.taken_at)}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '音声で確認', 
          onPress: () => PillSpeech.speak(speechText) 
        }
      ]
    );
  };

  const renderMedicationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recordItem}
      onPress={() => handleRecordPress(item)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleRow}>
          <Text style={styles.pillName}>
            {item.pill_name || 'ロキソニン錠60mg'}
          </Text>
          <View style={[
            styles.timePeriodBadge,
            { backgroundColor: getTimePeriodColor(item.time_period) }
          ]}>
            <Ionicons 
              name={getTimePeriodIcon(item.time_period)} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={styles.timePeriodText}>
              {MedicationRecordService.getTimePeriodLabel(item.time_period)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.recordDate}>{formatDate(item.taken_at)}</Text>
      </View>

      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business" size={14} color="#6C757D" />
          <Text style={styles.detailText}>
            {item.manufacturer || '第一三共'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="medical" size={14} color="#6C757D" />
          <Text style={styles.detailText}>
            {item.dosage || '60mg'}
          </Text>
        </View>

        {item.confidence_score && (
          <View style={styles.detailRow}>
            <Ionicons name="analytics" size={14} color="#6C757D" />
            <Text style={styles.detailText}>
              認識精度: {Math.round(item.confidence_score * 100)}%
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderTodaySection = () => {
    if (todayRecords.length === 0) return null;

    return (
      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>
          📅 今日の服薬記録 ({todayRecords.length}件)
        </Text>
        {todayRecords.map((record) => (
          <View key={record.id}>
            {renderMedicationItem({ item: record })}
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>服薬記録がありません</Text>
      <Text style={styles.emptySubtitle}>
        ロキソニンを撮影して記録を開始しましょう
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>服薬履歴</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#C7C7CC" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* 今日の記録セクション */}
      {renderTodaySection()}

      {/* 履歴リスト */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>
          📋 全体履歴 ({records.length}件)
        </Text>
        
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicationItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={records.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  todaySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F2F2F7',
  },
  historySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flex: 1,
    marginRight: 12,
  },
  recordTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  timePeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timePeriodText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recordDate: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  recordDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#495057',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: 20,
  },
});