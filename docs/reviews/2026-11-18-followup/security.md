# picomatch 安全後續與對抗驗證

2026-11-18 再查官方 npm registry、完整 npm audit 與 [GitHub advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)：latest 4.0.7，affected ≤4.0.7，官方無 patched version。16 個 high dependency entries 來自同一個 advisory，不能報成 16 個不同漏洞，也不能因只有一個就視為無風險。[上游 PR #194](https://github.com/micromatch/picomatch/pull/194) 未合併，不能作正式完整修補。

原始本地重查證據：`output/site-quality-validation/security-followup/{registry,audit,tree}.json`。lockfile 與套件版本本次未變更；沒有強制降框架版、忽略 advisory 或修改 node_modules。

## 實際可達性與對抗驗證

依 `/Users/ethanstudio/AGENTS.md` 的安全 Pass 2 要求，由獨立 `security_followup_review` agent 唯讀檢查 flagged code 與呼叫路徑。

| 結論                         | 證據                                                                                                        | 信心 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ---- |
| 確認真實漏洞                 | root 4.0.7 與 anymatch 內 2.3.2；隔離子程序用單分支重複 extglob 比對短字串，均超過 2 秒被父程序終止         | 1.00 |
| 確認發布缺口                 | CI review 有 npm audit，但兩條本機 release script 沒有                                                      | 0.98 |
| 未發現公開輸入到 glob 的路徑 | 三個 Functions 的 26 檔靜態 import closure，無外部模組／未解析匯入；搜尋使用 includes，投稿內容不是 pattern | 0.94 |
| 不是 16 個不同 CVE           | npm audit via 去重為同一 advisory                                                                           | 1.00 |

漏洞位於 `node_modules/picomatch/lib/parse.js` 的 `analyzeRepeatedExtglob`；單分支沒有多分支的保護。4.0.7 及 2.3.2 對 `+(*a)` 與 28 個 a 加 ! 均超過限制；固定 `**/*.json` 對照少於 0.2 ms。未對公開服務測試 payload。此處記錄 agent 實測，未把 npm metadata 當成重現。

`src/content.config.ts` 四個 collection 和縮圖載入均為開發者控制的固定 pattern。Astro 使用靜態輸出；當期本機 client bundles 無 picomatch 特徵是輔助證據，不能證明任何未檢查的部署版本、第三方服務或任意未來輸入皆安全。建置與開發工具仍含漏洞；`maxExtglobRecursion` 不能修此單分支問題。

## 本次補強

- `security:check` 使用完整 lockfile，明確包含 dev、optional、peer；high／critical 非零、指令錯誤、網路問題、缺漏／無法解析的報告均停止。
- `release:public` 與 `release:legacy` 在任何發布建置之前先跑安全檢查；`deploy:public` 繼承前者。這是發布流程的額外阻擋，沒有授權發布或繞過既有實播／內容門檻。
- CI review 改用同一檢查；每日 01:23 UTC（09:23 Taipei）workflow 留存原始 audit、commit、lock hash、時間與上游版本，失敗也保存 artifact，無自動更新／合併／外寄。
- 每日 workflow 必須合併到預設分支才會實際排程；本次未 push 或啟用。不把完成 YAML 當作監控已運作。

執行 `npm run security:check` 後，原始報告及摘要在 `artifacts/dependency-security/`（忽略於 Git）。目前正確結果是 exit 1 阻擋；這項預期阻擋不是「零漏洞通過」。

## 上游修補後的結案方式

確認 advisory patched range、官方發布與相容性，再更新 lockfile；涵蓋 root 與所有巢狀副本。以隔離程序重跑漏洞案例、完整依賴樹、unit、type、公開預覽及必要 E2E。完整 audit 通過才解除此安全阻擋。沒有 verified patch 時不建立臨時 fork 冒稱修補完成。

新閘門的對抗複核另找出兩個缺口，已修正：每筆 dependency severity 必須與 metadata 逐級計數一致，不能只信總數；上游 `npm view` 限制 60 秒，避免網路停滯耗盡 job 時間而來不及上傳證據。回歸測試含偽造低風險計數、null entry、無效格式、程序錯誤及逾時。
