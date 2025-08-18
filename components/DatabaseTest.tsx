// components/DatabaseTest.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase, Pill } from '@/lib/supabase';

export function DatabaseTest() {
  const [pills, setPills] = useState<Pill[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const testConnection = async () => {
    try {
      setLoading(true);
      setDebugInfo('接続テスト開始...');
      
      // データ取得テスト
      const { data, error } = await supabase
        .from('pills')
        .select('*')
        .limit(10);

      if (error) throw error;

      setPills(data || []);
      
      // supabaseUrl の代わりに環境変数を直接参照
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'Unknown';
      
      const message = `
✅ 接続成功
📊 取得件数: ${data?.length || 0}件
🔗 URL: ${supabaseUrl.substring(0, 30)}...
`;
      
      setDebugInfo(message);
      Alert.alert('成功', `${data?.length || 0}件の薬剤データを取得しました`);
      
    } catch (error: any) {
      const errorMessage = `❌ エラー: ${error.message}`;
      setDebugInfo(errorMessage);
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    try {
      setLoading(true);
      
      // 検索関数のテスト
      const { data, error } = await supabase
        .rpc('search_pills', { search_term: 'ロキソニン' });

      if (error) {
        // フォールバック検索
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pills')
          .select('*')
          .ilike('name', '%ロキソニン%');

        if (fallbackError) throw fallbackError;
        
        Alert.alert('検索成功（フォールバック）', `${fallbackData?.length || 0}件見つかりました`);
        setPills(fallbackData || []);
      } else {
        Alert.alert('検索成功', `${data?.length || 0}件見つかりました`);
        setPills(data || []);
      }
      
    } catch (error: any) {
      Alert.alert('検索エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'テスト中...' : 'データベース接続テスト'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.searchButton]} 
          onPress={testSearch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            検索機能テスト
          </Text>
        </TouchableOpacity>
      </View>

      {debugInfo ? (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>デバッグ情報:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      ) : null}

      {pills.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>取得データ:</Text>
          {pills.map((pill) => (
            <View key={pill.id} style={styles.pillItemContainer}>
              <Text style={styles.pillItem}>
                📋 {pill.name}
              </Text>
              <Text style={styles.pillDetails}>
                🏭 {pill.manufacturer} • 💊 {pill.dosage}
              </Text>
              <Text style={styles.pillDescription}>
                📝 {pill.description}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    gap: 8,
  },
  button: {
    backgroundColor: '#28A745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  debugContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  debugText: {
    fontSize: 12,
    color: '#6C757D',
    fontFamily: 'monospace',
  },
  resultsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pillItemContainer: {
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  pillItem: {
    fontWeight: 'bold',
    color: '#212529',
  },
  pillDetails: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  pillDescription: {
    fontSize: 12,
    color: '#495057',
    marginTop: 2,
  },
});