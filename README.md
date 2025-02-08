# LLM Autofill Extension

Chrome拡張機能を用いて、LLM（大規模言語モデル）によるウェブフォームの自動入力を実現するプロジェクトです。

## 機能概要

- 複数のプロフィール登録・管理機能
- OpenAI、Gemini、Claude等のLLM API KEY管理機能
- LLMを活用したインテリジェントなフォーム自動入力
- フォーム項目名の命名揺れに対する柔軟な対応

## 開発環境のセットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発用ビルド
npm run dev

# プロダクション用ビルド
npm run build
```

## ディレクトリ構成

```
.
├── src/                # ソースコード
│   ├── background/     # バックグラウンドスクリプト
│   ├── content/        # コンテンツスクリプト
│   ├── popup/         # ポップアップUI
│   └── options/       # オプション画面
├── public/            # 静的ファイル
└── dist/             # ビルド成果物
```

## 技術スタック

- TypeScript
- React
- Tailwind CSS
- OpenAI API / Gemini API / Claude API

## ライセンス

MIT License
