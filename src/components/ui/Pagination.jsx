import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function Pagination({ pagination, onPageChange }) {
  const { page = 1, limit = 10, total = 0, totalPages = 0 } = pagination || {};
  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="text-sm text-muted">
        Showing <strong>{from}</strong>-<strong>{to}</strong> of <strong>{total}</strong>
      </span>

      {totalPages > 1 && (
        <div className="pages">
          <button
            type="button"
            className="page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          {pageWindow(page, totalPages).map((item, index) =>
            item === '...' ? (
              // eslint-disable-next-line react/no-array-index-key
              <span key={`gap-${index}`} className="text-muted" style={{ padding: '0 4px' }}>
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`page-btn ${item === page ? 'active' : ''}`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
