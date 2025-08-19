import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義
export type Pill = {
  id: string;
  name: string;
  generic_name?: string;
  manufacturer?: string;
  dosage?: string;
  description?: string;
  package_color?: string;
  image_url?: string;
  keywords?: string[];
  created_at: string;
}