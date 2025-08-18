// lib/vision-api.ts
import * as FileSystem from 'expo-file-system';

export interface VisionTextAnnotation {
  description: string;
  boundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
}

export interface VisionAPIResponse {
  textAnnotations: VisionTextAnnotation[];
  fullTextAnnotation?: {
    text: string;
  };
}

export interface RecognitionResult {
  pillName?: string;
  manufacturer?: string;
  dosage?: string;
  confidence: number;
  rawText: string;
  detectedTexts: string[];  
  matchedPill?: any; 
}

export class VisionAPIClient {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeImage(imageUri: string): Promise<VisionAPIResponse> {
    try {
      console.log('🔍 Vision API 解析開始:', imageUri);
      
      // 画像をBase64に変換
      const base64Image = await this.convertToBase64(imageUri);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 100,
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 50,
              },
            ],
          },
        ],
      };

      console.log('📤 Vision API リクエスト送信中...');
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ Vision API レスポンス受信');
      console.log('📝 認識テキスト数:', result.responses[0]?.textAnnotations?.length || 0);
      
      return result.responses[0] || { textAnnotations: [] };
    } catch (error) {
      console.error('❌ Vision API エラー:', error);
      throw error;
    }
  }

  private async convertToBase64(imageUri: string): Promise<string> {
    try {
      console.log('🔄 Base64変換中:', imageUri);
      
      // 画像をBase64に変換
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ Base64変換完了, サイズ:', Math.round(base64.length / 1024), 'KB');
      return base64;
    } catch (error) {
      console.error('❌ Base64変換エラー:', error);
      throw new Error('画像の変換に失敗しました');
    }
  }
}

// 薬剤情報抽出ロジック
export class PillRecognizer {
  static extractPillInfo(visionResult: VisionAPIResponse): {
    pillName?: string;
    manufacturer?: string;
    dosage?: string;
    confidence: number;
    rawText: string;
    detectedTexts: string[];
  } {
    if (!visionResult.textAnnotations || visionResult.textAnnotations.length === 0) {
      return {
        confidence: 0,
        rawText: '',
        detectedTexts: [],
      };
    }

    const fullText = visionResult.fullTextAnnotation?.text || '';
    const allTexts = visionResult.textAnnotations.map(t => t.description);
    
    console.log('🔍 認識されたテキスト:', fullText);
    console.log('📋 個別テキスト:', allTexts.slice(1, 10)); // 最初の10個のテキストを表示

    // より柔軟な薬剤名パターン
    const pillPatterns = [
      // 具体的な薬剤名
      /(ロキソニン錠?\d*mg?)/gi,
      /(カロナール錠?\d*)/gi,
      /(ガスター\d*)/gi,
      /(ムコダイン錠?\d*mg?)/gi,
      /(アレグラ錠?\d*mg?)/gi,
      /(バファリン[AＡ]?)/gi,
      /(イブ[AＡ]?錠?)/gi,
      /(正露丸)/gi,
      /(パブロン[\w]*)/gi,
      /(ビオフェルミン[\w]*)/gi,
      
      // 一般的なパターン
      /([ァ-ヴー]+錠\d*mg?)/gi,
      /([ァ-ヴー]+カプセル)/gi,
      /([ァ-ヴー]+散)/gi,
      /([A-Za-z]+錠?\d*mg?)/gi,
    ];

    // 製造元パターン（より広範囲）
    const manufacturerPatterns = [
      /(第一三共[\w]*)/gi,
      /(昭和薬品[\w]*)/gi,
      /(杏林製薬)/gi,
      /(サノフィ)/gi,
      /(ライオン)/gi,
      /(エスエス製薬)/gi,
      /(大幸薬品)/gi,
      /(大正製薬)/gi,
      /(ビオフェルミン製薬)/gi,
      /([ァ-ヴー]*製薬)/gi,
      /([ァ-ヴー]*ファーマ)/gi,
    ];

    // 用量パターン
    const dosagePatterns = [
      /(\d+\.?\d*mg)/gi,
      /(\d+\.?\d*g)/gi,
      /(\d+錠)/gi,
      /(\d+カプセル)/gi,
    ];

    let pillName: string | undefined;
    let manufacturer: string | undefined;
    let dosage: string | undefined;

    // 薬剤名検索（最も信頼性の高いものを選択）
    for (const pattern of pillPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        // 最も長いマッチを選択（より詳細な情報）
        pillName = matches.reduce((a, b) => a.length > b.length ? a : b);
        console.log('💊 薬剤名検出:', pillName);
        break;
      }
    }

    // 製造元検索
    for (const pattern of manufacturerPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        manufacturer = matches[0];
        console.log('🏭 製造元検出:', manufacturer);
        break;
      }
    }

    // 用量検索
    for (const pattern of dosagePatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        dosage = matches[0];
        console.log('📏 用量検出:', dosage);
        break;
      }
    }

    // 信頼度計算（改良版）
    let confidence = 0.1; // ベース信頼度
    
    if (pillName) {
      confidence += 0.5;
      // 具体的な薬剤名なら追加ボーナス
      if (/(ロキソニン|カロナール|ガスター|ムコダイン|アレグラ|バファリン|イブ|正露丸|パブロン|ビオフェルミン)/.test(pillName)) {
        confidence += 0.2;
      }
    }
    if (manufacturer) confidence += 0.2;
    if (dosage) confidence += 0.1;
    
    // テキストの量に基づく追加信頼度
    if (fullText.length > 20) confidence += 0.1;

    const result = {
      pillName,
      manufacturer,
      dosage,
      confidence: Math.min(confidence, 1.0),
      rawText: fullText,
      detectedTexts: allTexts.slice(0, 10), // デバッグ用
    };

    console.log('📊 最終結果:', result);
    return result;
  }

  // データベースとの照合
  static async matchWithDatabase(
    extractedInfo: any,
    supabase: any
  ): Promise<any> {
    if (!extractedInfo.pillName) return null;

    try {
      console.log('🔍 データベース照合開始:', extractedInfo.pillName);
      
      // 薬剤名での検索
      const { data, error } = await supabase
        .from('pills')
        .select('*')
        .or(`name.ilike.%${extractedInfo.pillName}%,keywords.cs.{${extractedInfo.pillName}}`);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('✅ データベースマッチ:', data[0].name);
        return data[0];
      }

      console.log('❌ データベースマッチなし');
      return null;
    } catch (error) {
      console.error('❌ データベース検索エラー:', error);
      return null;
    }
  }
}