export default function DataTable({ columns, data, emptyText = 'No data found.', expandedRow }) {
    const colCount = columns.length;

    return (
        <div className="bg-[#111827] rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                    <colgroup>
                        {columns.map((col, i) => (
                            <col key={i} style={{ width: col.width, minWidth: col.minWidth }} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className="bg-[#1a2035]">
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={colCount} className="text-center py-16 text-gray-600">
                                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    {emptyText}
                                </td>
                            </tr>
                        )}
                        {data.map((row, rowIndex) => (
                            <>
                                <tr key={row.id ?? rowIndex} className="border-t border-gray-800/60 hover:bg-white/[0.02] transition-colors">
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                        >
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                                {expandedRow && expandedRow(row) && (
                                    <tr key={`${row.id ?? rowIndex}-expanded`}>
                                        <td colSpan={colCount} className="p-0">
                                            {expandedRow(row)}
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
