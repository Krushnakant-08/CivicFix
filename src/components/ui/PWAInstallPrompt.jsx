import { useState, useEffect } from 'react';
import { MdOutlineInstallDesktop } from 'react-icons/md';

/**
 * PWAInstallPrompt — Phase 8.1
 * 
 * Shows a custom "Install App" banner when the browser fires
 * the beforeinstallprompt event (Chrome/Android/Edge).
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa_banner_dismissed') === 'true'
  );

  useEffect(() => {
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner || installed || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Install CivicFix app"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
    >
      <div className="glass-card border border-stone-200 shadow-xl shadow-stone-200/70 p-4 flex items-center gap-4 animate-slide-up">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <MdOutlineInstallDesktop size={22} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 text-sm leading-tight">
            Install CivicFix
          </p>
          <p className="text-stone-600 text-xs mt-0.5 leading-snug">
            Works offline · Fast · No app store needed
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-stone-500 text-xs hover:text-stone-700 transition-colors text-center"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
