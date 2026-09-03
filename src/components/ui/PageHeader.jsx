export default function PageHeader({ title, description, actions = null, breadcrumb = null }) {
  return (
    <div>
      {breadcrumb}
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-desc">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}
