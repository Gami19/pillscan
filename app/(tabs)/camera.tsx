// app/camera.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isReady, setIsReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      // カメラとメディアライブラリの権限をリクエスト
      if (!permission?.granted) {
        await requestPermission();
      }
      if (!mediaPermission?.granted) {
        await requestMediaPermission();
      }
    })();
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>カメラの準備中...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={80} color="#6C757D" />
          <Text style={styles.permissionTitle}>カメラアクセス許可が必要です</Text>
          <Text style={styles.permissionMessage}>
            薬剤パッケージの撮影のためにカメラへのアクセスを許可してください
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>許可する</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);

      // 写真を撮影
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo) {
        // メディアライブラリに保存
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        }

        // 撮影成功の通知
        Alert.alert(
          '撮影完了',
          '薬剤パッケージの撮影が完了しました。AI解析を開始しますか？',
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: 'AI解析開始',
              onPress: () => {
                // 次のステップでAI解析画面に遷移
                router.push({
                  pathname: '/result',
                  params: { imageUri: photo.uri },
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('撮影エラー', '撮影に失敗しました。もう一度お試しください。');
      console.error('Camera error:', error);
    } finally {
      setCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>薬剤撮影</Text>
        <TouchableOpacity onPress={toggleCameraFacing} style={styles.headerButton}>
          <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* カメラビュー */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setIsReady(true)}
        >
          {/* 撮影ガイド */}
          <View style={styles.overlay}>
            <View style={styles.guidanceContainer}>
              <Text style={styles.guidanceText}>
                薬剤パッケージをフレーム内に配置してください
              </Text>
              <View style={styles.focusFrame} />
            </View>
          </View>
        </CameraView>
      </View>

      {/* コントロール */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          {/* プレースホルダー */}
          <View style={styles.controlButton} />
          
          {/* 撮影ボタン */}
          <TouchableOpacity
            style={[styles.captureButton, capturing && styles.captureButtonActive]}
            onPress={takePicture}
            disabled={!isReady || capturing}
          >
            <View style={styles.captureButtonInner}>
              {capturing ? (
                <Ionicons name="hourglass" size={24} color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          
          {/* フラッシュボタン（将来の拡張用） */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="flash-off" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.instructionText}>
          薬剤名・用法用量が見えるように撮影してください
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  headerButton: {
    padding: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  guidanceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guidanceText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  focusFrame: {
    width: width * 0.8,
    height: height * 0.3,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonActive: {
    backgroundColor: '#FF3B30',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
});