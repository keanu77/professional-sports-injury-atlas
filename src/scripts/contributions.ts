import { contributionContext } from "../lib/video/contribution-context";
import {
  CONTRIBUTION_DRAFT_KEY,
  CONTRIBUTION_DRAFT_TTL_MS,
  contributionErrors,
  parseContributionDraft,
  type ContributionFields,
  type ContributionKind,
} from "../lib/video/contribution-form";

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
  let challengeFailed = false;
  let challengeGeneration = 0;
  let challengeScript: HTMLScriptElement | undefined;
  let interacted = false;
  let deliveryUncertain = false;
  let draftExpiryTimer: ReturnType<typeof setTimeout> | undefined;
  const errorSummary = form.querySelector<HTMLElement>(
    "[data-contribution-errors]",
  )!;
  const draftStatus = form.querySelector<HTMLElement>(
    "[data-contribution-draft-status]",
  )!;
  const retryChallenge = form.querySelector<HTMLButtonElement>(
    "[data-contribution-retry-challenge]",
  )!;
  const retryDelivery = form.querySelector<HTMLButtonElement>(
    "[data-contribution-retry-delivery]",
  )!;
  const receipt = form.querySelector<HTMLElement>(
    "[data-contribution-receipt]",
  )!;
  const controls = { url, note, sources };
  const challenge = () =>
    (window as Window & { turnstile?: ChallengeApi }).turnstile;
  const requestedPage = new URLSearchParams(location.search).get("page");
  const context = contributionContext(
    new URLSearchParams(location.search).get("context"),
  );
  if (context) {
    document.querySelector("[data-contribution-intro]")!.textContent =
      "歡迎推薦近十年的教學影片與文獻，也可補充值得保留的經典。請簡述推薦理由，不必填寫姓名或信箱。";
    note.placeholder =
      "例如：影片適合哪個單元、文獻的教學價值，或需要修正的內容";
    document.title = "推薦影片與參考文獻｜運動醫學影像學習站";
    document.querySelector("[data-contribution-title]")!.textContent =
      "推薦影片與參考文獻";
    const info = document.querySelector<HTMLElement>(
      "[data-contribution-context]",
    )!;
    info.hidden = false;
    info.textContent = `來源課程：${context.label}｜${context.url}`;
    const back = document.querySelector<HTMLAnchorElement>(
      "[data-contribution-return]",
    )!;
    back.href = context.url;
    back.textContent = "← 回到影像課程";
    const done = thanks.querySelector<HTMLAnchorElement>("a")!;
    done.href = context.url;
    done.textContent = "繼續學習";
  }
  const pageUrl =
    context?.url ??
    (requestedPage?.startsWith("/") &&
    !requestedPage.startsWith("//") &&
    !requestedPage.includes("\\")
      ? new URL(requestedPage, "https://injury.sportsmedicine.tw").href
      : "");
  const fields = (): ContributionFields => ({
    type: new FormData(form).get("type") as ContributionKind,
    url: url.value,
    note: note.value,
    sources: sources.value,
  });
  const contentError = () =>
    Object.values(contributionErrors(fields()))[0] ?? "";
  let renderedErrorSignature: string | undefined;
  const showErrors = () => {
    const errors = contributionErrors(fields());
    const signature = JSON.stringify(
      (["url", "note", "sources"] as const).map((name) =>
        interacted ? (errors[name] ?? "") : "",
      ),
    );
    // Blurring an edited field fires change between pointerdown and click.
    // Keep unchanged links attached so that click and keyboard focus survive.
    if (signature === renderedErrorSignature) return;
    const list = errorSummary.querySelector("ul")!;
    list.replaceChildren();
    for (const name of ["url", "note", "sources"] as const) {
      const message = interacted ? errors[name] : undefined;
      const help = form.querySelector<HTMLElement>(
        `#contribution-${name}-error`,
      )!;
      controls[name].setAttribute("aria-invalid", String(!!message));
      help.hidden = !message;
      help.textContent = message ?? "";
      if (message) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#contribution-${name}`;
        link.textContent = message;
        link.addEventListener("click", (event) => {
          event.preventDefault();
          controls[name].focus();
        });
        item.append(link);
        list.append(item);
      }
    }
    errorSummary.hidden = !list.childElementCount;
    renderedErrorSignature = signature;
  };
  const clearStoredDraft = () => {
    clearTimeout(draftExpiryTimer);
    try {
      sessionStorage.removeItem(CONTRIBUTION_DRAFT_KEY);
    } catch {
      /* unavailable storage */
    }
  };
  const expireDraftAt = (savedAt: number) => {
    clearTimeout(draftExpiryTimer);
    draftExpiryTimer = setTimeout(
      () => {
        clearStoredDraft();
        draftStatus.textContent =
          "暫存草稿已到期清除；頁面上的文字仍可編輯。再次輸入後會重新暫存。";
      },
      Math.max(0, savedAt + CONTRIBUTION_DRAFT_TTL_MS - Date.now()),
    );
  };
  const saveDraft = () => {
    const content = fields();
    if (!content.url && !content.note && !content.sources) {
      clearStoredDraft();
      return;
    }
    try {
      const savedAt = Date.now();
      sessionStorage.setItem(
        CONTRIBUTION_DRAFT_KEY,
        JSON.stringify({
          version: 1,
          scope: pageUrl,
          savedAt,
          deliveryUncertain,
          ...content,
        }),
      );
      expireDraftAt(savedAt);
      draftStatus.textContent =
        "內容已在本分頁暫存 30 分鐘，成功送出後會清除。請勿填寫個資或病情。";
    } catch {
      draftStatus.textContent =
        "瀏覽器無法暫存草稿，重新整理前請自行保留公開連結與說明。";
    }
  };
  const refreshContent = () => {
    const error = contentError();
    showErrors();
    submit.disabled = busy || !!error || !token || deliveryUncertain;
    if (error) status.textContent = error;
    else if (deliveryUncertain) {
      retryDelivery.hidden = false;
    } else if (!challengeStarted && !challengeFailed) startChallenge();
    else if (!attempted && token) status.textContent = "驗證完成，可以送出。";
  };
  const syncKind = (prefill: boolean) => {
    const kind = fields().type;
    const correction = kind === "correction";
    form.querySelector("[data-url-label]")!.textContent = correction
      ? "需要修正的頁面網址"
      : kind === "reference"
        ? "文獻網址（或填下方參考來源）"
        : "公開影片網址（選填）";
    form.querySelector("[data-note-label]")!.textContent = correction
      ? "需要修正的內容與建議"
      : "補充說明（選填）";
    document.querySelector("#contribution-content-help")!.textContent =
      correction
        ? "請提供需要修正的頁面網址，並說明哪一段內容需要調整。"
        : kind === "reference"
          ? "請提供至少一個文獻網址，可貼 DOI、PubMed 或學會教材連結，並簡述推薦理由。"
          : "提供公開影片時，至少填寫公開影片網址、補充說明或有效參考來源其中一項。";
    url.required = correction;
    note.required = correction;
    note.minLength = correction ? 5 : 0;
    if (prefill) {
      if (correction && !url.value) url.value = pageUrl;
      else if (!correction && url.value === pageUrl) url.value = "";
    }
  };
  form.addEventListener("input", () => {
    interacted = true;
    saveDraft();
    refreshContent();
  });
  form.addEventListener("change", (event) => {
    if (
      event.target instanceof HTMLInputElement &&
      event.target.name === "type"
    )
      syncKind(true);
    interacted = true;
    saveDraft();
    refreshContent();
  });
  form
    .querySelector<HTMLButtonElement>("[data-contribution-clear-draft]")!
    .addEventListener("click", () => {
      if (busy) return;
      clearStoredDraft();
      form.reset();
      interacted = false;
      attempted = false;
      deliveryUncertain = false;
      retryDelivery.hidden = true;
      receipt.hidden = true;
      draftStatus.textContent =
        "本分頁草稿已清除。重新輸入後會再次暫存，請勿填寫個資或病情。";
      syncKind(false);
      refreshContent();
      url.focus();
    });
  retryDelivery.addEventListener("click", () => {
    if (busy) return;
    deliveryUncertain = false;
    retryDelivery.hidden = true;
    attempted = false;
    saveDraft();
    refreshContent();
    status.textContent =
      contentError() ||
      (token
        ? "已允許重試。請確認內容後再按送出；相同內容仍受防重寄限制。"
        : "請重新完成安全驗證，再決定是否送出。相同內容仍受防重寄限制。");
  });
  const markUncertain = () => {
    deliveryUncertain = true;
    retryDelivery.hidden = false;
    saveDraft();
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || deliveryUncertain) return;
    interacted = true;
    const error = contentError();
    if (error) {
      status.textContent = error;
      submit.disabled = true;
      showErrors();
      errorSummary.focus();
      return;
    }
    if (!token || !form.reportValidity()) return;
    busy = true;
    attempted = true;
    submit.disabled = true;
    status.textContent = "正在送出…";
    const fields = new FormData(form);
    // Persist before fetch: navigation can destroy this document before either
    // the response or catch runs, while the server may already have accepted it.
    deliveryUncertain = true;
    saveDraft();
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
          ...(context ? { contextUrl: context.url } : {}),
          website: fields.get("website"),
          turnstileToken: token,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const requestId = response.headers.get("X-Contribution-Request-Id");
      receipt.hidden = !requestId || !/^[0-9a-f-]{36}$/i.test(requestId);
      receipt.textContent = receipt.hidden
        ? ""
        : `回報編號：${requestId}。此編號供查詢送件狀態，不代表已收件。`;
      if (!response.headers.get("content-type")?.includes("application/json")) {
        status.textContent =
          "寄信服務暫時無法回應，尚未確認送出。內容已保留；為避免重寄，請確認後再允許重試。";
        markUncertain();
        return;
      }
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (response.ok && result.ok === true) {
        clearStoredDraft();
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
                    : "目前無法確認訊息送出。內容已保留；為避免重寄，請確認後再允許重試，或使用主站聯絡頁。";
      if (
        result.error === "delivery" ||
        result.error === "verification-unavailable" ||
        response.status < 400 ||
        (response.status >= 500 && result.error !== "guard-unavailable")
      ) {
        markUncertain();
      } else {
        // Only an explicit rejection makes a fresh attempt safe to offer.
        deliveryUncertain = false;
        retryDelivery.hidden = true;
        saveDraft();
      }
    } catch {
      status.textContent =
        "連線中斷，無法確認送出結果。內容已保留；為避免重寄，請確認後再允許重試。";
      markUncertain();
    } finally {
      busy = false;
      token = "";
      if (!form.hidden && widget) {
        try {
          challenge()?.reset(widget);
        } catch {
          challengeFailed = true;
          retryChallenge.hidden = false;
        }
      }
      submit.disabled = true;
    }
  });
  const startChallenge = () => {
    if (challengeStarted) return;
    challengeStarted = true;
    challengeFailed = false;
    retryChallenge.hidden = true;
    status.textContent = "正在準備安全驗證…";
    const generation = ++challengeGeneration;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = () => {
      if (generation !== challengeGeneration) return;
      clearTimeout(timer);
      challengeFailed = true;
      challengeStarted = false;
      token = "";
      submit.disabled = true;
      retryChallenge.hidden = false;
      status.textContent =
        "安全驗證無法載入。內容已保留，可按「重新載入安全驗證」，或使用主站聯絡頁。";
    };
    const render = () => {
      if (generation !== challengeGeneration || challengeFailed) return;
      clearTimeout(timer);
      const api = challenge();
      if (!api) {
        fail();
        return;
      }
      status.textContent = contentError() || "請完成上方安全驗證，再送出資料。";
      try {
        widget = api.render(
          form.querySelector<HTMLElement>("[data-contribution-challenge]")!,
          {
            sitekey: "0x4AAAAAADyuOfFI_URsi8Ap",
            action: "atlas-contribution",
            size: form.clientWidth < 300 ? "compact" : "flexible",
            theme: "auto",
            callback: (value: string) => {
              if (generation !== challengeGeneration) return;
              challengeFailed = false;
              retryChallenge.hidden = true;
              token = value;
              refreshContent();
            },
            "expired-callback": () => {
              token = "";
              submit.disabled = true;
              retryChallenge.hidden = false;
              status.textContent = "驗證已過期，請重新完成驗證。";
            },
            "error-callback": fail,
          },
        );
      } catch {
        fail();
      }
    };
    if (challenge()) {
      render();
      return;
    }
    challengeScript?.remove();
    challengeScript = document.createElement("script");
    challengeScript.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    challengeScript.async = true;
    challengeScript.addEventListener("load", render, { once: true });
    challengeScript.addEventListener("error", fail, { once: true });
    timer = setTimeout(fail, 15000);
    document.head.append(challengeScript);
  };
  retryChallenge.addEventListener("click", () => {
    if (busy) return;
    token = "";
    challengeFailed = false;
    retryChallenge.hidden = true;
    if (widget && challenge()) {
      try {
        challengeStarted = true;
        status.textContent = "請重新完成安全驗證。";
        challenge()!.reset(widget);
      } catch {
        challengeFailed = true;
        retryChallenge.hidden = false;
        status.textContent =
          "安全驗證暫時無法重新啟動，內容已保留，請稍後再試。";
      }
    } else {
      challengeStarted = false;
      startChallenge();
    }
    submit.disabled = true;
  });
  try {
    const raw = sessionStorage.getItem(CONTRIBUTION_DRAFT_KEY);
    const draft = parseContributionDraft(raw, pageUrl);
    if (draft) {
      form.querySelector<HTMLInputElement>(
        `input[name="type"][value="${draft.type}"]`,
      )!.checked = true;
      url.value = draft.url;
      note.value = draft.note;
      sources.value = draft.sources;
      deliveryUncertain = draft.deliveryUncertain;
      expireDraftAt(draft.savedAt);
      syncKind(false);
      draftStatus.textContent =
        "已恢復本分頁 30 分鐘內的草稿；安全驗證需重新完成。成功送出後會清除草稿。";
      if (deliveryUncertain) {
        retryDelivery.hidden = false;
        status.textContent =
          "上次送出結果尚未確認。請先確認是否需要重試，避免重寄。";
      }
    } else if (raw) clearStoredDraft();
  } catch {
    draftStatus.textContent =
      "瀏覽器無法暫存草稿，重新整理前請自行保留公開連結與說明。";
  }
  refreshContent();
}
export {};
