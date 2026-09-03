import { useId } from 'react';

function Wrapper({ label, required, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

export function Input({ label, required, hint, error, className, icon: Icon, ...rest }) {
  const id = useId();
  const field = (
    <input id={id} className={`input ${error ? 'has-error' : ''}`.trim()} {...rest} />
  );

  return (
    <Wrapper label={label} required={required} hint={hint} error={error} htmlFor={id} className={className}>
      {Icon ? (
        <div className="input-group">
          <span className="input-icon">
            <Icon size={16} />
          </span>
          {field}
        </div>
      ) : (
        field
      )}
    </Wrapper>
  );
}

export function Select({ label, required, hint, error, className, children, ...rest }) {
  const id = useId();
  return (
    <Wrapper label={label} required={required} hint={hint} error={error} htmlFor={id} className={className}>
      <select id={id} className={`select ${error ? 'has-error' : ''}`.trim()} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Textarea({ label, required, hint, error, className, ...rest }) {
  const id = useId();
  return (
    <Wrapper label={label} required={required} hint={hint} error={error} htmlFor={id} className={className}>
      <textarea id={id} className={`textarea ${error ? 'has-error' : ''}`.trim()} {...rest} />
    </Wrapper>
  );
}

export function Checkbox({ label, ...rest }) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

export default Input;
