type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: SnapCallbacks) => void;
    };
  }
}

const loadedScripts = new Map<string, Promise<void>>();

export function loadSnapScript(clientKey: string, scriptUrl: string): Promise<void> {
  const cacheKey = `${clientKey}|${scriptUrl}`;

  if (window.snap) {
    return Promise.resolve();
  }

  if (!loadedScripts.has(cacheKey)) {
    loadedScripts.set(
      cacheKey,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.setAttribute("data-client-key", clientKey);
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          loadedScripts.delete(cacheKey);
          reject(new Error("Gagal memuat modul pembayaran Midtrans."));
        };
        document.head.appendChild(script);
      }),
    );
  }

  return loadedScripts.get(cacheKey)!.then(() => {
    if (window.snap) return;
    return new Promise<void>((resolve, reject) => {
      let tries = 0;
      const timer = setInterval(() => {
        if (window.snap) {
          clearInterval(timer);
          resolve();
        } else if (tries > 50) {
          clearInterval(timer);
          reject(new Error("Midtrans Snap tidak merespons. Coba lagi."));
        }
        tries += 1;
      }, 100);
    });
  });
}

export async function snapPay(
  clientKey: string,
  scriptUrl: string,
  token: string,
  callbacks: SnapCallbacks,
): Promise<void> {
  await loadSnapScript(clientKey, scriptUrl);
  if (!window.snap) {
    throw new Error("Modul pembayaran belum siap.");
  }
  window.snap.pay(token, callbacks);
}

export type { SnapCallbacks };
