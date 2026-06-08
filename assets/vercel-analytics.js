function initQueue() {
  if (window.va) return;
  window.va = function (...params) {
    window.vaq = window.vaq || [];
    window.vaq.push(params);
  };
}

export function inject() {
  if (typeof window === "undefined") return;
  const src = "/_vercel/insights/script.js";
  initQueue();
  if (document.head.querySelector(`script[src*="${src}"]`)) return;

  const script = document.createElement("script");
  script.src = src;
  script.dataset.sdkn = "@vercel/analytics";
  script.dataset.sdkv = "2.0.1";
  script.defer = true;
  script.onerror = () => {
    console.log("[Vercel Web Analytics] Failed to load script. Be sure Web Analytics is enabled for this Vercel project and deploy again.");
  };

  document.head.appendChild(script);
}

export default { inject };
