"use client";

import { useEffect } from "react";

/**
 * يسجّل الـ Service Worker حتى يعمل الموقع بلا إنترنت على الهاتف.
 * لا يفعل شيئًا في بيئة التطوير حتى لا تُخزَّن ملفات قديمة أثناء العمل.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const register = () => {
      navigator.serviceWorker
        .register(`${base}/sw.js`, { scope: `${base}/` })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
