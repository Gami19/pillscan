// app/(tabs)/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DatabaseTest } from '@/components/DatabaseTest';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダーセクション */}
        <View style={styles.header}>
          <Text style={styles.title}>PillScan</Text>
          <Text style={styles.subtitle}>スマート服薬管理</Text>
        </View>

        {/* メインコンテンツ */}
        <View style={styles.mainContent}>
          {/* カメラセクション */}
          <View style={styles.cameraSection}>
            <Ionicons name="camera" size={80} color="#007AFF" />
            <Text style={styles.cameraText}>薬剤パッケージを撮影</Text>
            
            <Link href="/camera" asChild>
              <TouchableOpacity style={styles.cameraButton}>
                <Text style={styles.buttonText}>撮影開始</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* クイックアクション */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>クイックアクション</Text>
            
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="time" size={24} color="#28A745" />
                <Text style={styles.actionText}>服薬履歴</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="settings" size={24} color="#6C757D" />
                <Text style={styles.actionText}>設定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 🔧 開発者テストセクション（ここが重要！） */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>🔧 開発者テスト</Text>
          <DatabaseTest />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  mainContent: {
    padding: 20,
  },
  cameraSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraText: {
    fontSize: 18,
    color: '#212529',
    marginVertical: 16,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#495057',
  },
  // 🔧 開発者テストセクションのスタイル
  debugSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFEAA7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
    textAlign: 'center',
  },
});