import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

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