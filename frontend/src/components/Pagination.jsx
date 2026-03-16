export default function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

        if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
        return pages;
    };

    return (
        <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
                Trang {page} / {totalPages}
            </p>
            <div className="flex items-center gap-1">
                <button
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    className="p-1.5 rounded-lg border border-gray-700 disabled:opacity-30 hover:bg-gray-700/50 text-gray-400 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-600 text-sm">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${page === p
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-gray-400 hover:bg-gray-700/50'
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="p-1.5 rounded-lg border border-gray-700 disabled:opacity-30 hover:bg-gray-700/50 text-gray-400 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
