import { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PillSpeech } from '@/lib/speech';

interface SpeechButtonProps {
  text: string;
  style?: any;
  disabled?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

export function SpeechButton({ 
  text, 
  style, 
  disabled = false, 
  onStart, 
  onComplete 
}: SpeechButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // 音声機能の初期化確認
    PillSpeech.initialize().then(setIsSupported);
  }, []);

  const handlePress = async () => {
    if (!isSupported) {
      Alert.alert('音声機能エラー', 'お使いのデバイスでは音声機能がサポートされていません');
      return;
    }

    if (isSpeaking) {
      // 音声停止
      await PillSpeech.stop();
      setIsSpeaking(false);
      return;
    }

    if (!text.trim()) {
      Alert.alert('エラー', '読み上げるテキストがありません');
      return;
    }

    try {
      setIsSpeaking(true);
      onStart?.();

      await PillSpeech.speak(text);
      
      setIsSpeaking(false);
      onComplete?.();
    } catch (error) {
      console.error('音声読み上げエラー:', error);
      setIsSpeaking(false);
      Alert.alert('音声エラー', '音声読み上げに失敗しました');
    }
  };

  if (!isSupported) {
    return null; // 音声機能が使えない場合は非表示
  }

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Ionicons 
        name={isSpeaking ? "stop" : "volume-high"} 
        size={20} 
        color={disabled ? "#6C757D" : "#FFFFFF"} 
      />
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {isSpeaking ? '停止' : '音声で確認'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#6C757D',
  },
});
