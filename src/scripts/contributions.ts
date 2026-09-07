import {
  CONTRIBUTION_CONTENT_REQUIRED,
  publicContributionUrl,
} from "../lib/video/contribution-content";

interface ChallengeApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widget: string) => void;
}
const form = document.querySelector<HTMLFormElement>(
  "[data-contribution-form]",
);
if (form) {
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const status = form.querySelector<HTMLElement>("[data-contribution-status]")!;
  const url = form.elements.namedItem("url") as HTMLInputElement;
  const note = form.elements.namedItem("note") as HTMLTextAreaElement;
  const sources = form.elements.namedItem("sources") as HTMLTextAreaElement;
  const thanks = document.querySelector<HTMLElement>(
    "[data-contribution-thanks]",
  )!;
  let token = "";
  let widget = "";
  let busy = false;
  let attempted = false;
  let challengeStarted = false;
  const challenge = () =>
    (window as Window & { turnstile?: ChallengeApi }).turnstile;
  const requestedPage = new URLSearchParams(location.search).get("page");
  const pageUrl =
    requestedPage?.startsWith("/") &&
    !requestedPage.startsWith("//") &&
    !requestedPage.includes("\\")
      ? new URL(requestedPage, "https://injury.sportsmedicine.tw").href
      : "";
  const contentError = () => {
    const correction = new FormData(form).get("type") === "correction";
    const sourceUrls = sources.value.trim()
      ? sources.value
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .map(publicContributionUrl)
      : [];
    if (sourceUrls.length > 3 || sourceUrls.some((value) => !value))
      return "參考來源請填寫有效的公開網址，每行一個，最多 3 個。";
    if (url.value.trim() && !publicContributionUrl(url.value))
      return "請填寫有效的公開網址。";
    if (correction && (!url.value.trim() || note.value.trim().length < 5))
      return "請提供需要修正的頁面網址，以及至少 5 個字的修正說明。";
    if (
      !correction &&
      !url.value.trim() &&
      !note.value.trim() &&
      !sourceUrls.length
    )
      return CONTRIBUTION_CONTENT_REQUIRED;
    return "";
  };
  const refreshContent = () => {
    const error = contentError();
    submit.disabled = busy || !!error || !token;
    if (error) status.textContent = error;
    else if (!challengeStarted) startChallenge();
    else if (!attempted && token) status.textContent = "驗證完成，可以送出。";
  };
  form.addEventListener("input", refreshContent);
  form.addEventListener("change", () => {
    const correction = new FormData(form).get("type") === "correction";
    form.querySelector("[data-url-label]")!.textContent = correction
      ? "需要修正的頁面網址"
      : "公開影片網址（選填）";
    form.querySelector("[data-note-label]")!.textContent = correction
      ? "需要修正的內容與建議"
      : "補充說明（選填）";
    url.required = correction;
    note.required = correction;
    note.minLength = correction ? 5 : 0;
    if (correction && !url.value) url.value = pageUrl;
    else if (!correction && url.value === pageUrl) url.value = "";
    refreshContent();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const error = contentError();
    if (error) {
      status.textContent = error;
      submit.disabled = true;
      return;
    }
    if (!token || !form.reportValidity()) return;
    busy = true;
    attempted = true;
    submit.disabled = true;
    status.textContent = "正在送出…";
    const fields = new FormData(form);
    try {
      const response = await fetch("/api/contributions", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fields.get("type"),
          url: fields.get("url"),
          note: fields.get("note"),
          sources: fields.get("sources"),
          website: fields.get("website"),
          turnstileToken: token,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (response.ok && result.ok === true) {
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        return;
      }
      status.textContent =
        result.error === "verification-invalid"
          ? "安全驗證未通過，請重新完成驗證後再送出。你填寫的內容已保留。"
          : result.error === "verification-unavailable"
            ? "安全驗證服務暫時無法使用，請稍後再試。你填寫的內容已保留。"
            : response.status === 429
              ? result.error === "ip-daily"
                ? "這個網路位址今天已達送出上限，請於台灣時間明天再試。內容已保留。"
                : result.error === "site-daily"
                  ? "本站今天的通知額度已滿，請於台灣時間明天再試。內容已保留。"
                  : result.error === "duplicate"
                    ? "相同內容在 10 分鐘內已有送出紀錄，暫不重寄。若尚未確認成功，請稍後再試。"
                    : "目前送出較頻繁，請稍後再試。"
              : response.status === 503
                ? "目前暫停送出，請稍後再試。你填寫的內容已保留。"
                : response.status === 400
                  ? "請確認網址、修正說明及參考來源，再重新驗證。"
                  : response.status === 413
                    ? "內容較長，請縮短說明或參考網址後再試。"
                    : "目前無法確認訊息送出，請稍後再試，或使用主站聯絡頁。";
    } catch {
      status.textContent = "連線中斷，無法確認送出結果。請稍後再試。";
    } finally {
      busy = false;
      token = "";
      if (!form.hidden && widget) challenge()?.reset(widget);
    }
  });
  const startChallenge = () => {
    if (challengeStarted) return;
    challengeStarted = true;
    status.textContent = "正在準備安全驗證…";
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.addEventListener("load", () => {
      const api = challenge();
      if (!api) {
        status.textContent = "安全驗證無法載入，請重新整理，或使用主站聯絡頁。";
        return;
      }
      status.textContent = contentError() || "請完成上方安全驗證，再送出資料。";
      widget = api.render(
        form.querySelector<HTMLElement>("[data-contribution-challenge]")!,
        {
          sitekey: "0x4AAAAAADyuOfFI_URsi8Ap",
          action: "atlas-contribution",
          size: form.clientWidth < 300 ? "compact" : "flexible",
          theme: "auto",
          callback: (value: string) => {
            token = value;
            refreshContent();
          },
          "expired-callback": () => {
            token = "";
            submit.disabled = true;
            status.textContent = "驗證已過期，請重新完成驗證。";
          },
          "error-callback": () => {
            token = "";
            submit.disabled = true;
            status.textContent = "安全驗證暫時無法載入，請重新整理頁面再試。";
          },
        },
      );
    });
    script.addEventListener("error", () => {
      status.textContent = "安全驗證無法載入，請重新整理，或使用主站聯絡頁。";
    });
    document.head.append(script);
  };
  refreshContent();
}
export {};
