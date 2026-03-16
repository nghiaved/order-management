/**
 * Reusable search + filter bar.
 * SRP: Only handles the filter UI — no data logic.
 *
 * @param {string}   search              — current search text
 * @param {Function} onSearchChange      — (value) => void
 * @param {string}   placeholder         — search input placeholder
 * @param {Array}    [filters]           — optional [{ value, label, options: [{value,label}], onChange }]
 * @param {number}   resultCount         — number of filtered results
 */
export default function SearchFilter({ search, onSearchChange, placeholder, filters = [], resultCount }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {placeholder && (
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        placeholder={placeholder}
                        className="bg-[#111827] border border-gray-700/50 rounded-xl pl-10 pr-4 py-1.5 w-72 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}
            {filters.map((f, i) =>
                f.type === 'date' ? (
                    <input
                        key={i}
                        type="date"
                        title={f.label || 'Filter by date'}
                        className="bg-[#111827] border border-gray-700/50 rounded-xl px-4 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                    />
                ) : (
                    <select
                        key={i}
                        className="bg-[#111827] border border-gray-700/50 rounded-xl px-4 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                    >
                        {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )
            )}
            <span className="text-xs text-gray-500 ml-auto">Kết quả: {resultCount}</span>
        </div>
    );
}
