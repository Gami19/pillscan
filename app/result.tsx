// app/result.tsx のロキソニン専用デモ版
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VisionAPIClient, PillRecognizer, RecognitionResult } from '@/lib/vision-api';
import { SpeechButton } from '@/components/SpeechButton';
import { PillSpeech } from '@/lib/speech';
import { MedicationRecordService, MedicationRecordInput } from '@/lib/medication-record';

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [speechText, setSpeechText] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    analyzeImage();
  }, []);

  useEffect(() => {
    if (result && !analyzing) {
      const greeting = PillSpeech.getTimeBasedGreeting();
      const pillInfo = PillSpeech.formatPillInfoForSpeech(result);
      setSpeechText(greeting + pillInfo);
    }
  }, [result, analyzing]);

  const analyzeImage = async () => {
  try {
    setAnalyzing(true);
    
    if (!imageUri) {
      throw new Error('画像が選択されていません');
    }

    console.log('🚀 AI解析開始（ロキソニン専用デモ）');

    // デモ用：必ずロキソニンとして認識
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ✅ 修正：正しいUUID形式を使用または削除
    const demoResult: RecognitionResult = {
      pillName: 'ロキソニン錠60mg',
      manufacturer: '第一三共',
      dosage: '60mg',
      confidence: 0.95,
      rawText: 'ロキソニン錠60mg 第一三共 解熱鎮痛消炎剤',
      detectedTexts: ['ロキソニン錠', '60mg', '第一三共', '解熱鎮痛消炎剤'],
      matchedPill: {
        // id: 'demo-loxonin-id',  // ❌ 無効なUUID形式
        id: undefined,  // ✅ 修正：undefined にする
        name: 'ロキソニン錠60mg',
        manufacturer: '第一三共',
        dosage: '60mg',
        description: '解熱鎮痛消炎剤'
      }
    };

    console.log('✅ AI解析完了（デモ結果）:', demoResult);
    setResult(demoResult);
    
  } catch (error: any) {
    console.error('❌ AI解析エラー:', error);
    
    // フォールバック：エラー時でもロキソニンとして認識
    const fallbackResult: RecognitionResult = {
      pillName: 'ロキソニン錠60mg',
      manufacturer: '第一三共',
      dosage: '60mg',
      confidence: 0.80,
      rawText: 'デモモード：ロキソニンとして認識',
      detectedTexts: ['ロキソニン'],
      matchedPill: undefined  // ✅ 修正：undefined にする
    };
    setResult(fallbackResult);
  } finally {
    setAnalyzing(false);
  }
};

  const handleConfirm = async () => {
    // ✅ 修正：result.pillNameの存在チェックを緩くする
    if (!result) {
      Alert.alert('エラー', '解析結果がありません');
      return;
    }

    try {
      const timePeriod = MedicationRecordService.getCurrentTimePeriod();
      const timePeriodLabel = MedicationRecordService.getTimePeriodLabel(timePeriod);
      const pillName = result.pillName || 'ロキソニン錠60mg'; // デフォルト値設定

      Alert.alert(
        '服薬記録保存',
        `以下の内容で服薬記録を保存しますか？\n\n薬剤名: ${pillName}\n時間帯: ${timePeriodLabel}`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '保存',
            onPress: async () => {
              await saveMedicationRecord(timePeriod);
            }
          },
          {
            text: '時間帯を変更',
            onPress: () => {
              showTimePeriodSelector();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('エラー', '保存処理でエラーが発生しました');
    }
  };

  const saveMedicationRecord = async (timePeriod: 'morning' | 'afternoon' | 'evening' | 'night') => {
    try {
      setSaving(true);
      console.log('💾 服薬記録保存処理開始...');

      const pillName = result?.pillName || 'ロキソニン錠60mg';
      const recordInput: MedicationRecordInput = {
        pillId: result?.matchedPill?.id,
        pillName: pillName,
        manufacturer: result?.manufacturer || '第一三共',
        dosage: result?.dosage || '60mg',
        imageUrl: imageUri,
        recognizedText: result?.rawText,
        confidenceScore: result?.confidence || 0.8,
        timePeriod,
      };

      const saveResult = await MedicationRecordService.saveMedicationRecord(recordInput);

      if (saveResult.success) {
        Alert.alert(
          '保存完了', 
          `服薬記録を保存しました\n\n薬剤名: ${recordInput.pillName}\n時間帯: ${MedicationRecordService.getTimePeriodLabel(timePeriod)}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                const completionMessage = `${recordInput.pillName}の服薬記録を保存しました。`;
                PillSpeech.speak(completionMessage);
                router.push('/');
              }
            }
          ]
        );
      } else {
        Alert.alert('保存エラー', saveResult.error || '不明なエラーが発生しました');
      }

    } catch (error: any) {
      console.error('❌ 保存処理エラー:', error);
      Alert.alert('エラー', `保存に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showTimePeriodSelector = () => {
    const timePeriods = [
      { key: 'morning', label: '朝' },
      { key: 'afternoon', label: '昼' },
      { key: 'evening', label: '夕方' },
      { key: 'night', label: '夜' }
    ];

    Alert.alert(
      '時間帯を選択',
      'いつ服薬しましたか？',
      [
        ...timePeriods.map(period => ({
          text: period.label,
          onPress: () => saveMedicationRecord(period.key as any)
        })),
        { text: 'キャンセル', style: 'cancel' }
      ]
    );
  };

  const handleRetake = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>AI解析結果（デモ）</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 撮影画像 */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        )}

        {/* 解析中 */}
        {analyzing && (
          <View style={styles.analyzingContainer}>
            <Ionicons name="scan" size={60} color="#007AFF" />
            <Text style={styles.analyzingText}>AI解析中...</Text>
            <Text style={styles.analyzingSubtext}>
              ロキソニンパッケージを解析しています（デモモード）
            </Text>
          </View>
        )}

        {/* 解析結果 */}
        {result && !analyzing && (
          <View style={styles.resultContainer}>
            {/* デモバナー */}
            <View style={styles.demoBanner}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.demoText}>デモモード：ロキソニン専用</Text>
            </View>

            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>
                認識精度: {Math.round(result.confidence * 100)}%
              </Text>
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill,
                    { 
                      width: `${result.confidence * 100}%`,
                      backgroundColor: '#28A745' // 常に緑色（高精度）
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.pillInfo}>
              <Text style={styles.pillName}>
                {result.pillName || 'ロキソニン錠60mg'}
              </Text>
              
              <View style={styles.pillDetails}>
                <View style={styles.pillDetailItem}>
                  <Ionicons name="business" size={16} color="#6C757D" />
                  <Text style={styles.pillDetailText}>
                    製造元: {result.manufacturer || '第一三共'}
                  </Text>
                </View>
                
                <View style={styles.pillDetailItem}>
                  <Ionicons name="medical" size={16} color="#6C757D" />
                  <Text style={styles.pillDetailText}>
                    用量: {result.dosage || '60mg'}
                  </Text>
                </View>
              </View>

              <View style={styles.rawTextContainer}>
                <Text style={styles.rawTextLabel}>認識テキスト:</Text>
                <Text style={styles.rawText}>
                  {result.rawText || 'ロキソニン錠60mg 第一三共'}
                </Text>
              </View>

              {/* 音声読み上げボタン */}
              <View style={styles.speechContainer}>
                <SpeechButton
                  text={speechText}
                  style={styles.speechButton}
                  disabled={false} // 常に有効
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ボタン */}
      {!analyzing && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.retakeButton]}
            onPress={handleRetake}
            disabled={saving}
          >
            <Ionicons name="camera" size={20} color="#6C757D" />
            <Text style={styles.retakeButtonText}>再撮影</Text>
          </TouchableOpacity>

          {/* ✅ 修正：常に有効な記録ボタン */}
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.confirmButton,
              saving && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={saving} // savingの時のみ無効
          >
            <Ionicons 
              name={saving ? "hourglass" : "checkmark"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.confirmButtonText}>
              {saving ? '保存中...' : '記録する'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// スタイル（追加分のみ）
const styles = StyleSheet.create({
  // 既存のスタイル...（前回と同じ）
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
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  analyzingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  resultContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // ✅ 新規：デモバナーのスタイル
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  confidenceContainer: {
    marginBottom: 20,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  pillInfo: {},
  pillName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  pillDetails: {
    marginBottom: 16,
  },
  pillDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pillDetailText: {
    fontSize: 16,
    color: '#495057',
    marginLeft: 8,
  },
  rawTextContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rawTextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 4,
  },
  rawText: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'monospace',
  },
  speechContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  speechButton: {
    minWidth: 200,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  retakeButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});