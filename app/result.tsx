// app/result.tsx
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
import { supabase } from '@/lib/supabase';

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState<RecognitionResult | null>(null);

  useEffect(() => {
    analyzeImage();
  }, []);

  const analyzeImage = async () => {
    try {
      setAnalyzing(true);
      
      if (!imageUri) {
        throw new Error('画像が選択されていません');
      }

      // Google Vision API キーの確認
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
      if (!apiKey) {
        throw new Error('Vision API キーが設定されていません');
      }

      console.log('🚀 AI解析開始');

      // Google Vision API クライアント初期化
      const visionClient = new VisionAPIClient(apiKey);
      
      // 画像解析実行
      const visionResult = await visionClient.analyzeImage(imageUri);
      
      // 薬剤情報抽出
      const extractedInfo = PillRecognizer.extractPillInfo(visionResult);
      
      // データベースとの照合
      const matchedPill = await PillRecognizer.matchWithDatabase(extractedInfo, supabase);
      
      // 結果をマージ
      const finalResult: RecognitionResult = {
        ...extractedInfo,
        matchedPill,
        // データベースの情報で補完
        pillName: matchedPill?.name || extractedInfo.pillName,
        manufacturer: matchedPill?.manufacturer || extractedInfo.manufacturer,
        dosage: matchedPill?.dosage || extractedInfo.dosage,
      };
      
      console.log('✅ AI解析完了:', finalResult);
      setResult(finalResult);
      
    } catch (error: any) {
      console.error('❌ AI解析エラー:', error);
      Alert.alert('エラー', `AI解析に失敗しました: ${error.message}`);
      
      // フォールバック: ダミーデータ表示
      const fallbackResult: RecognitionResult = {
        pillName: '認識できませんでした',
        confidence: 0.1,
        rawText: '画像からテキストを認識できませんでした',
        detectedTexts: [],
      };
      setResult(fallbackResult);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      '服薬記録',
      '服薬記録として保存しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '保存',
          onPress: () => {
            // 次のステップで実装: データベースに保存
            Alert.alert('保存完了', '服薬記録を保存しました', [
              { text: 'OK', onPress: () => router.push('/') }
            ]);
          }
        }
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
        <Text style={styles.title}>AI解析結果</Text>
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
              薬剤パッケージを解析しています
            </Text>
          </View>
        )}

        {/* 解析結果 */}
        {result && !analyzing && (
          <View style={styles.resultContainer}>
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
                      backgroundColor: result.confidence > 0.7 ? '#28A745' : result.confidence > 0.4 ? '#FFC107' : '#DC3545'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.pillInfo}>
              <Text style={styles.pillName}>
                {result.pillName || '薬剤名を認識できませんでした'}
              </Text>
              
              {(result.manufacturer || result.dosage) && (
                <View style={styles.pillDetails}>
                  {result.manufacturer && (
                    <View style={styles.pillDetailItem}>
                      <Ionicons name="business" size={16} color="#6C757D" />
                      <Text style={styles.pillDetailText}>
                        製造元: {result.manufacturer}
                      </Text>
                    </View>
                  )}
                  
                  {result.dosage && (
                    <View style={styles.pillDetailItem}>
                      <Ionicons name="medical" size={16} color="#6C757D" />
                      <Text style={styles.pillDetailText}>
                        用量: {result.dosage}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {result.rawText && (
                <View style={styles.rawTextContainer}>
                  <Text style={styles.rawTextLabel}>認識テキスト:</Text>
                  <Text style={styles.rawText}>{result.rawText}</Text>
                </View>
              )}

              {/* デバッグ情報（開発中のみ） */}
              {__DEV__ && result.detectedTexts && result.detectedTexts.length > 0 && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>🔍 デバッグ情報:</Text>
                  <Text style={styles.debugText}>
                    認識テキスト数: {result.detectedTexts.length}
                  </Text>
                  <Text style={styles.debugText}>
                    主要テキスト: {result.detectedTexts.slice(0, 5).join(', ')}
                  </Text>
                  {result.matchedPill && (
                    <Text style={styles.debugText}>
                      DB照合: ✅ {result.matchedPill.name}
                    </Text>
                  )}
                </View>
              )}
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
          >
            <Ionicons name="camera" size={20} color="#6C757D" />
            <Text style={styles.retakeButtonText}>再撮影</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
            disabled={!result?.pillName}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>記録する</Text>
          </TouchableOpacity>
        </View>
      )}
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
  pillInfo: {
    
  },
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
    marginBottom: 12,
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
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: '#6C757D',
    fontFamily: 'monospace',
    marginVertical: 1,
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
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});