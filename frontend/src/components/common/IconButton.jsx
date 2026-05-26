import Icon from './Icon.jsx';

function IconButton({ label, icon, badge = false, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative rounded-full p-2.5 text-brand-muted transition hover:bg-brand-card hover:text-brand-navy"
      {...rest}
    >
      <Icon name={icon} className="h-5 w-5" />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[8px] font-bold text-white leading-none border border-white shadow-sm animate-pulse">
          {typeof badge === 'number' || typeof badge === 'string' ? badge : ''}
        </span>
      ) : null}
    </button>
  );
}

export default IconButton;
