# Cloud Jet: Drift & Boost

**One button. Two golden moments. Every millisecond matters.**

Cloud Jet is a planned futuristic hover-racing time trial for the [Cloud9 × JetBrains Sky's the Limit Hackathon](https://cloud9.devpost.com/rules). Built by FlyPig. This repository starts with a design and development plan, not a finished game.

## 為什麼開發 / Why this game?

我們希望做出能讓人在活動攤位立即上手、願意再玩一次的作品，而不是需要長篇教學的展示。Cloud9 過去曾把黑客松作品帶到活動現場（[官方案例](https://cloud9.gg/case-study/jetbrains-hackathon/)），因此我們從「一個按鍵的精準度」出發，把反應測試轉化為有速度、路線與風險回饋的浮空賽車。

名字 Cloud Jet 結合雲端賽道與噴射加速的意象；Drift & Boost 直接說明玩法。作品為獨立參賽概念，不代表 Cloud9 或 JetBrains 官方產品或背書。

## 核心玩法 / The two golden moments

- 車輛自動前進，玩家只控制一個按鍵（首選 Space，之後加入觸控）。
- **黃金時間按下**：進入漂移。按住期間持續漂移、蓄積能量。
- **黃金時間放開**：結束漂移，沿出彎直線噴射加速。
- 太早或太晚按下會影響路線和蓄力；太早放開讓噴射較弱；太晚放開會延誤向前加速，也可能碰牆損耗時間。
- **偏差不會阻止完賽，只會損耗時間。** 不淘汰、不重開懲罰；需要安全引導和卡住復原。
- 固定賽道計時賽，以實際完賽時間比較。回饋必須呈現在車輛路線、速度和推進上，不只是一個 Perfect 標籤。

## 視覺與攤位目標

科技未來感、雲海上的浮空賽道、漂亮的噴射尾流及容易讀懂的彎道。探索以藍白和多彩幾何作為 Cloud9 / JetBrains 氣質的視覺呼應；正式商標或素材僅在確認授權後使用。先確保輸入清楚與畫面流暢，再增加特效。

設計目標：每輪約 45–75 秒、一鍵重玩、清楚排名、不用登入。這是我們的設計目標，不是主辦方規定。展場版本應可離線遊玩、快速重置；第二螢幕排行榜列為後續擴充。

## 開發方式：Codex 為主，JetBrains 負責可驗證的工程工作

預定採用 TypeScript + Vite + Three.js 的瀏覽器版本，避免先引入大型遊戲引擎。尚未安裝這些專案依賴或建立遊戲實作。

- **Codex**：主要程式開發、場景和 UI 迭代、文件與自動化測試。
- **JetBrains WebStorm**：針對漂移狀態機與輸入時間判定進行 TypeScript 檢查、斷點除錯、測試執行與重構審查，特別驗證按下 / 按住 / 放開與 frame rate 無關。
- **選用 Junie / Air**：只有在可用與授權確認後，協助提出邊界測試並審查修改；不是目前已完成的使用紀錄，也不是必要安裝項目。

選 WebStorm 不只是為了符合參賽工具條件：這款遊戲的公平性取決於時間與狀態的細節，需要能追蹤事件、重現錯誤、跑測試的工作流。實際採用的工具、版本、操作和證據將寫入 [開發日誌](docs/DEVELOPMENT_LOG.md)，不把計畫冒充成果。

## MVP 與接手開發

詳見 [MVP 計畫](docs/MVP.md)、[JetBrains 工作流](docs/JETBRAINS.md) 及 [Codex 指引](AGENTS.md)。

第一階段只做「直線 → 一個彎 → 出彎直線」，先驗證按住漂移與放開噴射是否好玩。再擴展完整計時賽道、視覺品質和攤位可靠性。此階段為專案建置與規劃，沒有可執行遊戲或已通過的遊戲測試。

## 開發歷程

- **2026-11-18**：確立活動攤位導向、單鍵雙時機玩法與容錯完賽原則。
- **2026-11-18**：定名 **Cloud Jet: Drift & Boost**，建立獨立公開 repository、設計文件和 Codex / JetBrains 分工計畫。
- 後續實作、測試結果、工具使用和設計修訂持續追加至開發日誌。

## License

Project-authored code and documentation: [MIT](LICENSE). Third-party names, trademarks, and future third-party assets are not licensed by this project; keep their rights and attribution separate.
