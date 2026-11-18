# picomatch 本地緩解修補

這是針對目前專案的本地防護，**不是官方安全版本，也不解除 npm audit 或發布門檻**。[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) 目前仍沒有 patched version；官方 npm latest 仍為 4.0.7。既有 16 high 是同一 advisory 的傳遞影響。

## 修改與相容性界線

本專案透過 Astro、Vite、tinyglobby 等使用 root picomatch 4.0.7；Astro → unstorage → anymatch 另帶 2.3.2。兩份官方 tarball 的 SHA-512 已對照 lockfile，解析器原始位元組也與已安裝版本相同。沒有換框架、套件版本、封裝名稱或 registry。

`scripts/security/picomatch-containment.mjs` 對兩版 `lib/parse.js` 套用有限變更：

- 真正被解析為 `+(...)`／`*(...)` 的重複 extglob 在產生正規表示式前拋出 `ATLAS_REPEATED_EXTGLOB_DISABLED`，包括沒有惡意的重複 extglob。這項語法在本專案暫時不可用，不能靜默退化成錯誤的比對結果。
- parser 與 fastpaths 強制 picomatch 的 `regex:false`，即使呼叫者傳 `regex:true` 也不恢復；這封住獨立審查實際找到的 `(a+)+`／`@(a+)+` 路徑。此選項不會停用所有 regex 語法，例如 optional group 與命名捕獲仍可能被接受。
- 普通 glob、brace、非重複 extglob 是否相容由明確測試與完整專案建置確認；若未來有合法需求依賴被停用語法，先調整固定 pattern，不能關掉防護。

這不是任意不可信 pattern 的安全保證。呼叫者自行供應的 RegExp、解析 state、`compileRe`／`toRegex` 原始正規表示式，以及其他未枚舉的複雜度問題不在修補證明範圍內。外部輸入仍不得直接當 glob／regex。

## 安裝與失效處理

`postinstall` 在正常 `npm ci`／`npm install` 後自動套用。腳本會遍歷已安裝套件，核對所有 picomatch 副本是否與 lockfile 一致；兩個版本、registry integrity、原始／修補後 SHA-256 都明列於 `picomatch-containment.json`。未知版本、位元組、遺漏副本或符號連結會停止，不猜測套用。先驗證全部副本，才以暫存檔及 rename 寫入。

```sh
npm run security:containment:apply
npm run security:containment:check
npm run security:check
```

前兩個命令只表示本地防護的狀態；第三個仍是完整 lockfile 安全稽核，不能互相替代。check 失敗時會將舊 `artifacts/dependency-security/containment.json` 更新成失敗狀態，不留下可誤用的成功紀錄。

標準開發、型別、單元測試、建置與發布命令會先核對防護。Astro 設定與公開預覽 build entry 也直接執行核對，避免只依靠 npm pre hooks。使用 `--ignore-scripts` 安裝時須明確執行 apply；直接使用低階套件 API 或修改工具鏈不屬於這些入口的保證範圍。

已實際執行乾淨 `npm ci`：434 個套件重裝後，postinstall 自動覆蓋兩份副本，lockfile 差異僅為 root `hasInstallScript:true`。沒有忽略 advisory、允許高風險發布，或修改歷史播放／醫療核可。

## 重現與獨立驗證

原版兩份套件對 `+(*a)` 與 28 個 a 加結尾驚嘆號，在隔離子程序均超過 1.5 秒，被父程序終止；沒有向公開網站送測試 payload。修補回歸包含 parse、makeRe、matcher、array 與 option 變體，每個子程序設硬性 timeout。實際 logs 與官方 tarball 比對紀錄在 `output/security-repair-20261118/`。

依全域 AGENTS 的安全 Pass 2 要求，獨立審查完整讀過套件呼叫鏈與防護程式。第一版只阻擋重複 extglob，仍存在原生 regex 形式的 timeout；後續加入強制 regex:false，並修復失敗報告未作廢的缺口。最終測試範圍與數據另記於 `security-repair-validation.json`，不能把測過的有限案例延伸成全 regex 安全。

## 上游有修補時

重新查官方 advisory、release 與 registry，升級相容版本並涵蓋所有巢狀副本。以相同隔離案例、相容性及全專案測試驗證後，再移除這套本地限制、manifest、postinstall 與檢查入口。未知版本會先被此工具拒絕，這是需要人工檢視的變更，不應自動放行。
