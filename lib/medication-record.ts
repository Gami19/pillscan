// lib/medication-record.ts
import { supabase } from '@/lib/supabase';
import * as Crypto from 'expo-crypto';

export interface MedicationRecordInput {
  pillId?: string;
  pillName: string;
  manufacturer?: string;
  dosage?: string;
  imageUrl?: string;
  recognizedText?: string;
  confidenceScore?: number;
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night';
  notes?: string;
}

export class MedicationRecordService {
  
  // 現在の時間帯を自動判定
  static getCurrentTimePeriod(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  // 時間帯の日本語表示
  static getTimePeriodLabel(timePeriod: string): string {
    const labels = {
      morning: '朝',
      afternoon: '昼',
      evening: '夕方',
      night: '夜'
    };
    return labels[timePeriod as keyof typeof labels] || '不明';
  }

  // 服薬記録を保存
  static async saveMedicationRecord(
    recordInput: MedicationRecordInput
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log('💾 服薬記録保存開始:', recordInput.pillName);

      // ユーザー情報取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('👤 匿名ユーザーとして記録します');
        // 匿名ユーザーの場合は、ローカルストレージに保存する選択肢もあり
        // 今回はプロフィール作成を省略してダミーIDを使用
      }

      // 一意なIDを生成
      const recordId = await Crypto.randomUUID();
      
      // 服薬記録データ準備
      const medicationRecord = {
        id: recordId,
        user_id: user?.id || null, // 認証ユーザーがいない場合はnull
        pill_id: recordInput.pillId || null,
        image_url: recordInput.imageUrl,
        recognized_text: recordInput.recognizedText,
        confidence_score: recordInput.confidenceScore,
        taken_at: new Date().toISOString(),
        time_period: recordInput.timePeriod,
        status: 'confirmed' as const,
        notes: recordInput.notes,
        created_at: new Date().toISOString(),
        // 認識情報も保存（pill_idがない場合用）
        pill_name: recordInput.pillName,
        manufacturer: recordInput.manufacturer,
        dosage: recordInput.dosage,
      };

      // データベースに保存
      const { data, error } = await supabase
        .from('medication_records')
        .insert([medicationRecord])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ 服薬記録保存成功:', data.id);
      
      return { 
        success: true, 
        id: data.id 
      };

    } catch (error: any) {
      console.error('❌ 服薬記録保存エラー:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // 今日の服薬記録を取得
  static async getTodayRecords(): Promise<any[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('medication_records')
        .select(`
          *,
          pills (
            name,
            manufacturer,
            dosage,
            description
          )
        `)
        .gte('taken_at', startOfDay)
        .lt('taken_at', endOfDay)
        .order('taken_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ 今日の記録取得エラー:', error);
      return [];
    }
  }

  // 最近の服薬記録を取得（履歴表示用）
  static async getRecentRecords(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('medication_records')
        .select(`
          *,
          pills (
            name,
            manufacturer,
            dosage,
            description
          )
        `)
        .order('taken_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ 履歴取得エラー:', error);
      return [];
    }
  }
}