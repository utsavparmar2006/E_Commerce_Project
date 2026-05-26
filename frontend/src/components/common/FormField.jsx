import FieldError from './FieldError.jsx';

function FormField({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  helperText,
  adornment,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm uppercase tracking-[0.16em] text-brand-ink">
        {label}
      </label>
      <div className="mt-3 flex items-center gap-3 border-b border-[#8e95a8] pb-3 focus-within:border-brand-navy">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="form-input-luxe w-full bg-transparent text-lg text-brand-navy placeholder:text-[#b8bdc9]"
        />
        {adornment ? <div className="shrink-0">{adornment}</div> : null}
      </div>
      {helperText && !error ? <p className="mt-2 text-xs text-brand-muted">{helperText}</p> : null}
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

export default FormField;
