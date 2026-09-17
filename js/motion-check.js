/* opt-in only: report local display conditions without sending or storing them. */
(() => {
  "use strict";
  if (new URLSearchParams(location.search).get("motion-check") !== "1") return;

  let scriptError = "なし";
  window.addEventListener("error", (event) => {
    const source = event.filename || event.target?.src || "";
    if (!/\/js\/main\.js(?:\?|$)/.test(source)) return;
    scriptError = event.message || "main.jsの読み込みに失敗";
  }, true);

  const panel = document.createElement("section");
  panel.setAttribute("aria-label", "表示の診断");
  panel.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:9999;" +
    "width:min(360px,calc(100% - 24px));max-height:70vh;overflow:auto;" +
    "padding:16px;background:#fff;color:#111;border:2px solid #111;" +
    "border-radius:8px;font:14px/1.6 sans-serif;box-shadow:0 2px 16px #0005;";
  const title = document.createElement("strong");
  title.textContent = "表示の診断";
  const report = document.createElement("pre");
  report.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;margin:8px 0;";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "診断結果をコピー";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "閉じる";
  for (const button of [copy, close]) {
    button.style.cssText = "padding:8px 12px;margin-right:8px;color:#111;" +
      "background:#eee;border:1px solid #777;border-radius:4px;font:inherit;cursor:pointer;";
  }
  panel.append(title, report, copy, close);
  document.body.append(panel);

  function update() {
    const journey = document.querySelector(".journey");
    const mode = journey?.dataset.displayMode;
    const modes = {
      animated: "1画面ずつ（通常の演出）",
      "content-motion": "1画面ずつ（数値・文字の演出あり／背景の動きを抑える）",
      "static-height": "縦並び（画面の高さ不足）",
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = [
      `更新版: ${document.documentElement.dataset.siteVersion || "不明"}`,
      `画面: ${innerWidth} × ${innerHeight}px`,
      `動きを減らす設定: ${reduced ? "オン" : "オフ"}`,
      `表示: ${modes[mode] || "初期化未完了"}`,
      `判定用の高さ: ${journey?.dataset.viewportHeight || "未取得"}px`,
      `必要な高さ: ${journey?.dataset.minimumHeight || "未取得"}px`,
      `JavaScript初期化: ${mode ? "完了" : "未完了"}`,
      `スクリプトエラー: ${scriptError}`,
    ];
    const text = lines.join("\n");
    if (report.textContent !== text) report.textContent = text;
  }
  update();
  const timer = setInterval(update, 1000);
  copy.addEventListener("click", async () => {
    update();
    try {
      await navigator.clipboard.writeText(report.textContent);
      copy.textContent = "コピーしました";
    } catch {
      copy.textContent = "表示内容を選択してコピーしてください";
    }
  });
  close.addEventListener("click", () => {
    clearInterval(timer);
    panel.remove();
  });
})();
