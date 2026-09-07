export const prerender = true;

export const PREFERENCES_INIT_SOURCE = `(()=>{const root=document.documentElement;let theme="light";let scale=1;try{if(window.localStorage.getItem("atlas-theme")==="dark")theme="dark";const raw=Number.parseFloat(window.localStorage.getItem("atlas-font-scale")??"1");if(Number.isFinite(raw))scale=Math.min(1.5,Math.max(.875,raw))}catch{}root.dataset.theme=theme;root.dataset.fontScale=String(scale);root.style.setProperty("--font-scale",String(scale))})();`;

export function GET() {
  return new Response(PREFERENCES_INIT_SOURCE, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
