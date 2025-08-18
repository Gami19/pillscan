// types/pill.ts
export interface Pill {
  id: string;
  name: string;
  generic_name?: string;
  manufacturer?: string;
  dosage?: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface MedicationRecord {
  id: string;
  user_id: string;
  pill_id?: string;
  image_url?: string;
  recognized_text?: string;
  confidence_score?: number;
  taken_at: string;
  time_period: 'morning' | 'afternoon' | 'evening' | 'night';
  status: 'pending' | 'confirmed' | 'skipped';
  notes?: string;
  created_at: string;
  pills?: Pill;
}

export interface RecognitionResult {
  pill_name?: string;
  user_name?: string;
  time_period?: string;
  confidence: number;
  raw_text: string;
}