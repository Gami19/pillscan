import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

export class PillSpeech {
  private static isSupported = true;
  private static isSpeaking = false;

  static async initialize(): Promise<boolean> {
    try {
      // 音声機能の利用可能性確認
      const voices = await Speech.getAvailableVoicesAsync();
      this.isSupported = voices.length > 0;
      
      console.log('🔊 音声機能初期化:', this.isSupported ? '利用可能' : '利用不可');
      console.log('📢 利用可能な音声:', voices.length, '種類');
      
      return this.isSupported;
    } catch (error) {
      console.error('❌ 音声機能初期化エラー:', error);
      this.isSupported = false;
      return false;
    }
  }

  static async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.isSupported) {
      console.warn('⚠️ 音声機能が利用できません');
      return;
    }

    try {
      // 既に話している場合は停止
      if (this.isSpeaking) {
        await this.stop();
      }

      this.isSpeaking = true;
      console.log('🗣️ 音声読み上げ開始:', text.substring(0, 50) + '...');

      const speechOptions: Speech.SpeechOptions = {
        language: options?.language || (Platform.OS === 'ios' ? 'ja-JP' : 'ja-JP'),
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 0.8, // ゆっくり読み上げ
        volume: options?.volume || 1.0,
        onStart: () => {
          console.log('🎵 音声読み上げ開始');
        },
        onDone: () => {
          console.log('✅ 音声読み上げ完了');
          this.isSpeaking = false;
        },
        onStopped: () => {
          console.log('⏹️ 音声読み上げ停止');
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('❌ 音声読み上げエラー:', error);
          this.isSpeaking = false;
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('❌ 音声読み上げエラー:', error);
      this.isSpeaking = false;
    }
  }

  static async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
      console.log('⏹️ 音声読み上げ停止');
    } catch (error) {
      console.error('❌ 音声停止エラー:', error);
    }
  }

  static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // 薬剤情報を音声用に整形
  static formatPillInfoForSpeech(result: any): string {
    let speechText = '';

    if (result.pillName) {
      speechText += `薬剤名は、${result.pillName}です。`;
    } else {
      speechText += '薬剤名を認識できませんでした。';
    }

    if (result.manufacturer) {
      speechText += `製造元は、${result.manufacturer}です。`;
    }

    if (result.dosage) {
      speechText += `用量は、${result.dosage}です。`;
    }

    const confidencePercent = Math.round(result.confidence * 100);
    speechText += `認識精度は、${confidencePercent}パーセントです。`;

    if (result.confidence < 0.5) {
      speechText += '認識精度が低いため、再撮影をお勧めします。';
    }

    return speechText;
  }

  // 服薬時間帯の音声案内
  static getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'おはようございます。朝の服薬時間ですね。';
    } else if (hour >= 12 && hour < 17) {
      return 'こんにちは。昼の服薬時間ですね。';
    } else if (hour >= 17 && hour < 21) {
      return 'こんばんは。夕方の服薬時間ですね。';
    } else {
      return 'お疲れさまです。夜の服薬時間ですね。';
    }
  }
}