import Constants from 'expo-constants';

// app.config.tsのextraから環境変数を取得
const extra = Constants.expoConfig?.extra || {};

// 環境変数をまとめたオブジェクト
export const config = {
  supabaseUrl: extra.supabaseUrl as string,
  supabaseAnonKey: extra.supabaseAnonKey as string,
  googleVisionApiKey: extra.googleVisionApiKey as string,
  apiUrl: extra.apiUrl as string,
};

// 型チェック（必須の環境変数）
const requiredVars = ['supabaseUrl', 'supabaseAnonKey'];
for (const key of requiredVars) {
  if (!config[key as keyof typeof config]) {
    console.warn(`Missing required config variable: ${key}`);
  }
}