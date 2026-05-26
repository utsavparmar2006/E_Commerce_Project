import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

function GlobalToaster() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleLuxeToast = (e) => {
      const { type, text } = e.detail;

      if (window.luxeToastTimer) {
        window.clearTimeout(window.luxeToastTimer);
      }

      setToast({ type, text, visible: true });

      window.luxeToastTimer = window.setTimeout(() => {
        setToast((curr) => curr ? { ...curr, visible: false } : null);
      }, 3500);
    };

    window.addEventListener('luxe-toast', handleLuxeToast);
    return () => {
      window.removeEventListener('luxe-toast', handleLuxeToast);
      if (window.luxeToastTimer) {
        window.clearTimeout(window.luxeToastTimer);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-8 right-8 z-[200] w-[calc(100vw-4rem)] max-w-sm rounded-[1.6rem] border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md transition-all duration-500 ease-out transform sm:w-full ${
        toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
      } ${
        toast.type === 'cart'
          ? 'border-emerald-100 bg-emerald-50/95 text-emerald-900 shadow-emerald-100/10'
          : toast.type === 'wishlist'
            ? 'border-rose-100 bg-rose-50/95 text-rose-900 shadow-rose-100/10'
            : 'border-brand-line bg-brand-soft/95 text-brand-navy shadow-brand-navy/5'
      }`}
      role="alert"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
          toast.type === 'cart'
            ? 'bg-emerald-500 text-white'
            : toast.type === 'wishlist'
              ? 'bg-rose-500 text-white'
              : 'bg-brand-muted text-white'
        }`}>
          <Icon
            name={toast.type === 'cart' ? 'bag' : 'heart'}
            className="h-4.5 w-4.5"
            filled={toast.type !== 'wishlist-remove'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-75">
            {toast.type === 'cart' ? 'Shopping Cart' : 'Curated Wishlist'}
          </h4>
          <p className="text-xs mt-1 font-semibold leading-relaxed break-words text-left">
            {toast.text}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setToast((prev) => prev ? { ...prev, visible: false } : null)}
          className="flex-shrink-0 text-current opacity-40 hover:opacity-100 transition p-1 hover:bg-brand-soft/20 rounded-full cursor-pointer"
          aria-label="Dismiss alert"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default GlobalToaster;
