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
  const thanks = document.querySelector<HTMLElement>(
    "[data-contribution-thanks]",
  )!;
  let token = "";
  let widget = "";
  let busy = false;
  let attempted = false;
  const challenge = () =>
    (window as Window & { turnstile?: ChallengeApi }).turnstile;
  const requestedPage = new URLSearchParams(location.search).get("page");
  const pageUrl =
    requestedPage?.startsWith("/") &&
    !requestedPage.startsWith("//") &&
    !requestedPage.includes("\\")
      ? new URL(requestedPage, "https://injury.sportsmedicine.tw").href
      : "";
  form.addEventListener("change", () => {
    const correction = new FormData(form).get("type") === "correction";
    form.querySelector("[data-url-label]")!.textContent = correction
      ? "需要修正的頁面網址"
      : "公開影片網址";
    form.querySelector("[data-note-label]")!.textContent = correction
      ? "需要修正的內容與建議"
      : "補充說明（選填）";
    note.required = correction;
    note.minLength = correction ? 5 : 0;
    if (correction && !url.value) url.value = pageUrl;
    else if (!correction && url.value === pageUrl) url.value = "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !token || !form.reportValidity()) return;
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
        response.status === 429
          ? "目前送出較頻繁，請稍後再試。"
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
    status.textContent = "請完成上方安全驗證，再送出資料。";
    widget = api.render(
      form.querySelector<HTMLElement>("[data-contribution-challenge]")!,
      {
        sitekey: "0x4AAAAAADyuOfFI_URsi8Ap",
        action: "atlas-contribution",
        size: form.clientWidth < 300 ? "compact" : "flexible",
        theme: "auto",
        callback: (value: string) => {
          token = value;
          submit.disabled = busy;
          if (!attempted) status.textContent = "驗證完成，可以送出。";
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
}
export {};
