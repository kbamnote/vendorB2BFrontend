export default function Button({
  children,
  variant = 'primary',
  size,
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...rest
}) {
  const variantClass = variant === 'primary' ? '' : `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={`spinner ${variant === 'secondary' || variant === 'ghost' ? '' : 'on-dark'}`} />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {children}
    </button>
  );
}
