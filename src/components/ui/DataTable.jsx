import { LoadingBlock } from './Spinner';
import EmptyState from './EmptyState';

/**
 * Small declarative table.
 *
 * columns: [{ key, header, render?, width?, align?, className? }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row._id,
  loading = false,
  error = null,
  empty = {},
  onRowClick = null,
}) {
  if (loading) return <LoadingBlock />;

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div className="alert alert-error">{error.message || 'Unable to load this list.'}</div>
      </div>
    );
  }

  if (!rows.length) return <EmptyState {...empty} />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left' }}
                className={col.align === 'right' ? 'col-actions' : ''}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                  className={[col.className, col.align === 'right' ? 'col-actions' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.render ? col.render(row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
