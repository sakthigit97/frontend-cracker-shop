interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      {/* Prev */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`
          px-3 py-2 rounded-lg border text-sm
          ${
            currentPage === 1
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "border-gray-300 hover:bg-gray-100"
          }
        `}
      >
        Prev
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              px-3 py-2 rounded-lg text-sm border
              ${
                isActive
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "border-gray-300 hover:bg-gray-100"
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`
          px-3 py-2 rounded-lg border text-sm
          ${
            currentPage === totalPages
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "border-gray-300 hover:bg-gray-100"
          }
        `}
      >
        Next
      </button>
    </div>
  );
}