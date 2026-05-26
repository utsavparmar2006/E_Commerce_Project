function StatusMessage({ tone, text }) {
  const toneClasses =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700';

  return <div className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>{text}</div>;
}

export default StatusMessage;
