const SESSION_ENDPOINT = "/__woven-wishes-preview-session";
const CHANNEL_NAME = "woven-wishes-preview-sync";

export function startPreviewSync(): () => void {
  let activeSession: string | undefined;
  let checking = false;
  let reloading = false;
  let announced = false;
  const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(CHANNEL_NAME) : undefined;

  const checkSession = async () => {
    if (checking || reloading) return;
    checking = true;

    try {
      const response = await fetch(`${SESSION_ENDPOINT}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;

      const serverSession = (await response.text()).trim();
      if (!serverSession) return;

      if (activeSession && serverSession !== activeSession) {
        reloading = true;
        window.location.reload();
        return;
      }

      if (!activeSession) {
        activeSession = serverSession;
        document.documentElement.dataset.previewSession = serverSession;
      }
      if (!announced) {
        announced = true;
        channel?.postMessage("check-current-session");
      }
    } catch {
      // A stopped preview server is expected. The next successful poll restores the page.
    } finally {
      checking = false;
    }
  };

  const onChannelMessage = () => void checkSession();
  const onPageShow = () => void checkSession();
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") void checkSession();
  };

  channel?.addEventListener("message", onChannelMessage);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", onVisibilityChange);
  const interval = window.setInterval(() => void checkSession(), 2_500);
  void checkSession();

  const dispose = () => {
    window.clearInterval(interval);
    channel?.removeEventListener("message", onChannelMessage);
    channel?.close();
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };

  import.meta.hot?.dispose(dispose);
  return dispose;
}
