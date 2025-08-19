# nodeのVersionに注意！EAS Buildは使用しない
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## PillScan システム仕様書

### 0.開発フロー
#### フェーズ 1: 基本セットアップとナビゲーション（1-2日）
   - 1.1 Firebase設定
   config/firebase.ts を作成：
   - 1.2 基本的な型定義を作成
   types/index.ts:
   - 1.3 基本的な画面構造を実装
   提示したレイアウトファイル群を実装
#### フェーズ 2: カメラ機能の実装（2-3日）
   - 2.1 Vision Camera セットアップ
   app.json に必要なプラグインを追加：
   - 2.2 カメラコンポーネントの実装
   components/Camera/VisionCameraView.tsx:
#### フェーズ 3: OCR機能の実装（3-4日）
   - 3.1 OCR サービスの実装
   services/ocrService.ts:
#### フェーズ 4: 音声読み上げ機能（1-2日）
   - 4.1 音声サービスの実装
   services/speechService.ts:
#### フェーズ 5: データ管理とFirestore連携（2-3日）
   - 5.1 データサービスの実装
   services/dataService.ts:
#### フェーズ 6: 統合とテスト（3-4日）
   - 6.1 メインカメラ画面の統合
   app/(tabs)/camera.tsx:

### 開発の進め方
1. 段階的な実装
各フェーズを順番に実装し、それぞれで動作確認を行います。

2. テスト用データの準備
実際の薬剤パッケージの画像をいくつか用意し、OCR精度をテストします。

3. エラーハンドリングの強化
各段階でエラーケースを想定した処理を追加します。

4. パフォーマンスの最適化
画像処理時間の短縮、メモリ使用量の最適化を行います。

### 1. システム概要
#### 1.1 システム名
   PillScan - スマホカメラ＋AI画像認識システム

#### 1.2 目的
   スマートフォンのカメラを使用して薬剤パッケージを撮影し、AI画像認識により薬剤情報を自動識別することで、服薬管理をサポートするシステム

#### 1.3 システムコンセプト
   撮影: スマートフォンのカメラで薬剤パッケージを撮影
   認識: AI画像認識で薬剤名・利用者名・時間帯を自動識別
   確認: 音声読み上げ機能で確認をサポート
### 2. 技術スタック
|分野|技術|用途|Version|
|---|---|----|-----|
|node npm||node: 'v21.1.0', npm: 'v10.2.0'|
|フロントエンド|Expo(Typescript)|クロスプラットフォーム対応のモバイルアプリ開発|0.24.20|
|AI・機械学習|ML Kit|オンデバイスでの画像認識処理|
|バックエンド|Firebase Web SDK|データ同期・認証|2025/08/17|
|データベース|Firestore Database|アカウントデータ|2025/08/17|
|ストレージ|GAS × Cloudflare Workers|画像の保存位置|2025/08/17|
|音声機能|Web Speech API|音声読み上げ・音声認識|
### 3. システム機能要件
### 3.1 主要機能
#### 3.1.1 カメラ撮影機能
   機能概要: スマートフォンのカメラを使用した薬剤パッケージの撮影
   詳細要件:
   リアルタイムプレビュー表示
   オートフォーカス機能
   フラッシュ機能（光量不足時）
   撮影画像の一時保存
   複数枚連続撮影対応
#### 3.1.2 AI画像認識機能
   機能概要: 撮影画像からの薬剤情報自動識別
   認識対象:
   - 薬剤名（商品名・一般名）
   - 利用者名（処方箋の患者名）
   - 服用時間帯（朝・昼・夜・就寝前等）
   - 用法・用量
   - 処方日・有効期限
   技術仕様:
   - TensorFlow Liteモデルを使用したオンデバイス処理
   - ML Kitの文字認識（OCR）機能
   - 信頼度スコア付き認識結果
#### 3.1.3 音声読み上げ機能
   機能概要: 認識結果の音声による確認サポート
   詳細要件:
   薬剤名の読み上げ
   利用者名の読み上げ
   服用時間・用法の読み上げ
   読み上げ速度調整
   音量調整
   多言語対応（日本語・英語）
#### 3.1.4 データ管理機能
   機能概要: 薬剤情報の保存・管理
   詳細要件:
   認識履歴の保存
   ユーザー別データ管理
   データの同期（複数デバイス間）
   データのエクスポート機能
   データの削除機能
### 3.2 補助機能
#### 3.2.1 ユーザー認証機能
   機能概要: Firebase Authenticationを使用したユーザー管理
   認証方式:
   メールアドレス認証
   Google認証
   Apple認証（iOS）
   匿名認証
#### 3.2.2 設定機能
   機能概要: アプリケーションの各種設定
   設定項目:
   - 音声読み上げの有効/無効
   - 読み上げ言語設定
   - カメラ設定（解像度・フラッシュ）
   - データ同期設定
   - 通知設定
#### 3.2.3 履歴管理機能
   機能概要: 過去の認識結果の管理
   機能詳細:
   - 認識履歴一覧表示
   - 日付・薬剤名での検索
   - 履歴の詳細表示
   - 履歴の編集・削除
### 4. システムアーキテクチャ
### 4.1 全体構成
[スマートフォンアプリ (Expo)]
    ↓
[カメラ機能] → [AI画像認識 (ML Kit)]
    ↓
[音声読み上げ (Web Speech API)]
    ↓
[Firebase (認証・データベース・同期)]

[スマートフォンアプリ] 
    ↓ 画像アップロード
[Cloudflare Workers] → [Google Apps Script] → [Google Drive]
    ↓ 画像URL返却
[Firebase Firestore] (メタデータのみ保存)

### 4.2 データフロー
   1. 撮影: ユーザーがカメラで薬剤パッケージを撮影
   2. 前処理: 画像の品質向上・ノイズ除去
   3. AI認識: TensorFlow Lite/ML Kitによる文字・画像認識
   4. 結果処理: 認識結果の構造化・信頼度評価
   5. 音声出力: Web Speech APIによる読み上げ
   6. データ保存: Firebaseへの結果保存・同期
### 4.3 アプリケーション構成
#### 4.3.1 画面構成
   ホーム画面: メイン機能へのアクセス
   カメラ画面: 撮影機能
   結果表示画面: 認識結果表示・音声読み上げ
   履歴画面: 過去の認識結果一覧
   設定画面: アプリケーション設定
   ユーザー管理画面: ログイン・アカウント管理

### 5 データ設計（基本的な型定義）
#### 5.1 User
   ````typescript
   interface User {
      uid: string;
      email: string;
      displayName: string;
      createdAt: Date;
   }
   ````
#### 5.2 認証結果
   ```typescript
   interface RecognitionResult {
      id: string;
      userId: string;
      timestamp: Date;
      imageUri: string;
      recognizedText: string;
      medicationName?: string;
      patientName?: string;
      dosageTime?: string;
      confidence: number;
   }
   ```
#### ローカル
   ```typescript
   // AsyncStorageで管理するデータ
   interface LocalStorage {
      userSettings: UserSettings;
      offlineResults: RecognitionResult[];
      cameraPermissions: boolean;
      audioPermissions: boolean;
      lastSyncTimestamp: number;
   }
   ```
#### 5.3 config/firebase.ts
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getFunctions } from 'firebase/functions';
   import { getStorage } from 'firebase/storage';

   const firebaseConfig = {
   // Firebase Console の設定をここに貼り付け
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const functions = getFunctions(app);
   export const storage = getStorage(app);
   ```

### 6. AI・機械学習要件
#### 6.1 画像認識モデル
##### 6.1.1 文字認識（OCR）
   エンジン: ML Kit Text Recognition API
   対応言語: 日本語、英語
   認識対象: 薬剤名、患者名、用法・用量、日付
##### 6.1.2 薬剤パッケージ認識
   エンジン: TensorFlow Lite カスタムモデル
   学習データ: 日本国内の主要薬剤パッケージ画像
   認識精度目標: 90%以上
##### 6.1.3 前処理要件
   画像の明度・コントラスト調整
   ノイズ除去
   傾き補正
   文字領域の検出・切り出し
#### 6.2 モデル更新機能
Firebase Remote Configによるモデル配信
アプリ起動時のモデル更新チェック
差分更新によるデータ使用量削減

### 7 ディレクトリ構造

```
PillScan/
├── app/                      # Expo Router
│   ├── (tabs)/              
│   │   ├── index.tsx         # 🏠 ホーム画面
│   │   ├── camera.tsx        # 📷 撮影画面
│   │   ├── history.tsx       # 📋 服薬履歴
│   │   ├── profile.tsx       # 👤 プロフィール
│   │   └── _layout.tsx
│   ├── camera/
│   │   └── index.tsx         # カメラモーダル
│   ├── result/
│   │   └── [id].tsx          # 認識結果詳細
│   ├── confirmation/
│   │   └── [id].tsx          # 音声確認画面
│   ├── _layout.tsx
│   └── +not-found.tsx
├── components/
│   ├── camera/
│   │   ├── CameraView.tsx    # カメラコンポーネント
│   │   └── CameraControls.tsx
│   ├── pill/
│   │   ├── PillCard.tsx      # 薬剤情報カード
│   │   ├── PillList.tsx      # 薬剤リスト
│   │   └── RecognitionResult.tsx
│   ├── speech/
│   │   └── SpeechButton.tsx  # 音声読み上げ
│   └── ui/
│       ├── Button.tsx
│       ├── LoadingSpinner.tsx
│       └── StatusBar.tsx
├── lib/
│   ├── supabase.ts           # データベース接続
│   ├── vision-ai.ts          # AI画像認識
│   ├── speech.ts             # 音声機能
│   ├── camera.ts             # カメラユーティリティ
│   └── utils.ts              # 共通ユーティリティ
├── types/
│   ├── pill.ts               # 薬剤関連型
│   ├── camera.ts             # カメラ関連型
│   └── database.ts           # DB型定義
├── constants/
│   ├── pills.ts              # 薬剤マスターデータ
│   ├── Colors.ts             # カラーテーマ
│   └── Config.ts             # アプリ設定
├── hooks/
│   ├── useCamera.ts          # カメラフック
│   ├── useSpeech.ts          # 音声フック
│   ├── usePillRecognition.ts # AI認識フック
│   └── useColorScheme.ts
├── assets/
│   ├── images/
│   │   ├── pill-placeholder.png
│   │   └── camera-overlay.png
│   └── sounds/              # 音声ファイル
│       └── notification.mp3
├── .env.local               # 環境変数
├── app.json
├── package.json
└── tsconfig.json
```
