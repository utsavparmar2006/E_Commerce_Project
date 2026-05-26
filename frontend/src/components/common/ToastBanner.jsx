import Icon from './Icon.jsx';

function ToastBanner({ notice, onDismiss }) {
  const classes =
    notice.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-sky-200 bg-sky-50 text-sky-700';

  return (
    <div className="sticky top-0 z-[60] border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur">
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm ${classes}`}>
        <p>{notice.text}</p>
        <button type="button" onClick={onDismiss} className="text-current opacity-70 transition hover:opacity-100">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default ToastBanner;
