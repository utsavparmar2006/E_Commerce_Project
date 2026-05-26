function SectionHeader({ title, description, centered = false }) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-brand-navy sm:text-[2.1rem]">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-brand-muted">{description}</p> : null}
    </div>
  );
}

export default SectionHeader;
