# JTB × 宇宙

HTML・CSS・JavaScriptで構成した静的サイトです。画像・SVG・Webフォントを同梱しており、ビルドや外部ライブラリーのインストールは不要です。

## 表示・配置方法

`index.html`をブラウザーで開くと表示できます。ローカルHTTPサーバーを使う場合は、リポジトリーのルートで次を実行し、`http://localhost:8000`を開いてください（Python 3が必要です）。

```sh
python3 -m http.server 8000
```

Webサーバーには、下記のファイルとディレクトリーを階層ごと配置してください。画像・CSS・JavaScriptは相対パスで参照し、サブディレクトリーへの配置にも対応しています。

```text
site/
├── index.html
├── css/
│   ├── style.css      共通値・基本スタイル
│   ├── corporate.css  共通ヘッダー・フッター
│   ├── sections.css   EARTH × SPACE〜CONTACT
│   └── intro.css      FV・高度体験・VISION・月面背景
├── js/
│   ├── main.js
│   └── motion-check.js 診断URLでのみ動作
├── assets/
│   ├── images/        写真・ロゴ（WebP）
│   ├── icons/         アイコン（SVG）
│   └── fonts/         Webフォント（WOFF2）・ライセンス
└── README.md
```

## ページ構成と動作

- FVから地上・10km・25km・100km・400km・38万kmへ、スクロールに連動して背景・コピー・高度表示が切り替わります。高度ナビから各場面へ移動できます。
- 38万kmからVISIONは月面背景を共有し、VISIONの文章はスクロールに合わせて表示します。
- EARTH × SPACEはEARTH SIDE・CONNECT・SPACE SIDEのタブと矢印で切り替えます。初期選択はCONNECTで、自動再生はありません。
- DOMAINは各項目を個別に開閉できます。その後にNEWS・PROJECT・CONTACTが続きます。
- PC・スマートフォンで同じHTMLを使用します。本文のレイアウトは767px以下、共通ヘッダーは1199px以下で切り替わります。
- 高さが低い画面では、FVと高度体験だけをコンパクトに配置して固定演出を維持します。通常サイズの画面では従来の配置を使用します。
- 「動きを減らす」設定でも、FVと高度体験は1画面ずつ切り替えます。ズーム・フェード・数字カウント・文字の段階表示は停止し、VISIONは全文を通常のスクロールで読めるようにします。
- 極端に低い画面（767px以下の幅では高さ480px未満、それより広い画面では固定ヘッダー・ナビを除いた高さ320px未満）では、各場面を縦に並べます。JavaScript無効時も本文と標準HTMLの詳細開閉を利用できます。

## 編集する場所

| 対象 | ファイル・編集箇所 |
| --- | --- |
| 本文・記事・リンク・画像の参照先 | `index.html` |
| 共通の色・余白・フォント・基本スタイル | `css/style.css` |
| 共通ヘッダー・フッター | `css/corporate.css` |
| EARTH × SPACE・DOMAIN・NEWS・PROJECT・CONTACT | `css/sections.css` |
| FV・高度体験・VISION・背景の切り取り位置 | `css/intro.css` |
| タブ・詳細開閉・文字表示・スクロール演出 | `js/main.js` |

CSSの読み込み順は`index.html`に記載した順序を保ってください。

### 背景画像

画像を差し替える場合は、`index.html`の対象画像の`src`と、実際の画像サイズに対応する`width`・`height`を更新してください。

| 表示箇所 | `assets/images/`内のファイル |
| --- | --- |
| FV・地上 | `intro-0km.webp` |
| 10km | `intro-10km.webp` |
| 25km | `intro-25km.webp` |
| 100km | `intro-100km.webp` |
| 400km | `intro-400km.webp` |
| 38万km〜VISION終了 | `intro-moon.webp` |
| DOMAIN | `moon-surface.webp` |
| EARTH SIDE | `side-earth.webp` |
| CONNECT | `side-connect.webp` |
| SPACE SIDE | `side-space.webp` |
| CONTACT | `contact-earth.webp` |

38万km〜VISIONの画像は`.intro-lunar-image`、DOMAINの画像は`.lunar-background`で管理します。月面背景全体の範囲は`.lunar-scope`、FV〜VISIONの範囲はその内側の`.intro-scope`です。背景の切り取り位置は`css/intro.css`のPC・スマートフォンそれぞれの指定を確認してください。

### フォント

フォントの読み込みと共通変数は`css/style.css`に定義しています。Noto Sans JP・Zen Old Mincho・Manrope・Interを同梱し、表示時に外部のフォントサービスへ接続しません。個別要素の書体は各セクションのCSSで指定しています。

フォントを再配布する場合は、`assets/fonts/LICENSE-*.txt`も保持してください。

### スクロール・アニメーション

`js/main.js`の`initializeJourney`内で、高度体験の距離と時間を調整できます。

| 設定 | 役割 |
| --- | --- |
| `HERO_DISTANCE` | FVから最初の高度に切り替わるまでの距離（画面高に対する比率） |
| `SCENE_DISTANCE` | 各高度に割り当てる距離（画面高に対する比率） |
| `COUNT_DURATION` | 高度カウントの時間（ミリ秒） |
| `SCENE_ZOOM_LIMIT` | 背景の拡大幅の上限 |
| `SCENE_ZOOM_TIME` | 背景拡大の時間係数（ミリ秒） |

高度体験全体の長さは`css/intro.css`の`.journey.is-animated`、VISIONの長さは`.vision.is-animated`で調整します。場面数や距離を変更した場合は、各場面とVISIONへの遷移を確認してください。

高度の共通表示は`.altitude-readout`です。縦位置は`css/intro.css`の`--altitude-readout-top`で調整します。JavaScript無効時や固定演出を使わない表示では、各場面内の高度表示を使用します。

低い画面の配置は`.journey.is-compact`に限定しています。判定には背景と同じ`--screen-height`（対応ブラウザーでは`100svh`）の実測値を使い、スマートフォンのブラウザーバーの伸縮だけで固定演出が切り替わらないようにしています。

高度の数値カウントとVISIONの文字を白くするスクロール演出は、PC・スマートフォンともに端末の「動きを減らす」設定によらず有効です（固定演出が使える画面高の場合）。切替ボタンは設けていません。背景ズーム、スクロール矢印、シーン内コピーの登場、ページ内リンクのスムーズスクロールなどの装飾的な動きには、引き続き端末設定を反映します。画面高不足やJavaScript無効時の通常フロー表示は維持しています。

### 特定の端末だけ表示が異なる場合

URLに`?motion-check=1`を付けると、その端末の「動きを減らす」設定、画面サイズ、表示モード、必要な高さ、JavaScript初期化状態を表示します。「診断結果をコピー」で共有できます。診断結果は画面内でのみ作成し、自動送信・保存は行いません。通常URLでは診断UIは表示されません。

「動きを減らす設定: オン」でも、表示が「数値・文字の演出あり／背景の動きを抑える」であれば数値カウントとVISION演出が動作します。

## 公開先への組み込み

NEWSのイベント4件とPROJECT・CONTACTの外部リンクは設定済みです。ページ内ナビ、高度ナビ、SIDE切り替え、DOMAINの開閉は動作します。

| 対象 | 設定状況・必要な対応 |
| --- | --- |
| NEWS | イベント4件のリンクを設定済み。ホームページ公開・TeNQはリンク先未設定、グループ発足のお知らせはリンクなし |
| PROJECT | CTAに`https://open-universe-project.jp/`を設定済み |
| CONTACT | CTAに`https://www.jtbbwt.com/business/contact/`を設定済み。フォーム本体は含みません |
| 共通ヘッダー・フッター | `data-common-header`・`data-common-footer`の要素を導入先の共通部品に差し替え |

PROJECT・CONTACTのリンク先は、`a.cta`の`href`で変更できます。共通ヘッダー・フッターの検索や各導線も、導入先の部品で実装してください。

共通ヘッダーの高さを変える場合は、`css/style.css`の`--header-height`・`--page-nav-height`も合わせて調整してください。ページ内移動や固定表示の位置に使用しています。

## 更新・公開時の確認

- PC・スマートフォン幅で、画像・フォントの読み込み、横はみ出し、文字の重なりを確認する。
- 高度体験を前後にスクロールし、背景・コピー・数値・ナビの同期と、38万kmからVISION終了までの背景を確認する。
- 各高度への直接移動・再読み込み、SIDEのタブと矢印、DOMAINの開閉、キーボード操作を確認する。
- 「動きを減らす」設定、横向きなどの低い画面、JavaScript無効時の本文表示を確認する。
- 公開先で画像の更新反映、リンク先、共通部品との組み合わせを確認する。

iOS Safariの下部バー背面が単色になる問題は未解決です。モバイルの背景表示は実機でも確認してください。
