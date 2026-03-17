import { useState, useEffect, useRef, useMemo } from 'react';
import { fmt } from '../utils/format';

/**
 * Searchable product autocomplete — same UX as the customer search in OrderForm.
 *
 * Props:
 *   products       – full product array
 *   inventoryMap   – { [product_id]: inventoryItem }  (optional, shows stock)
 *   value          – currently selected product_id
 *   onChange(id)   – called with the new product_id string when user picks one
 *   inputClassName – optional extra classes for the input element
 *   showPrice      – show base_price in the dropdown (default true)
 */
export default function ProductSearchInput({
    products = [],
    inventoryMap = {},
    value,
    onChange,
    inputClassName = '',
    showPrice = true,
    top = 0,
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const ref = useRef(null);
    const inputRef = useRef(null);

    // Sync display text when value is set externally (edit mode / reset)
    useEffect(() => {
        if (!value) {
            setSearch('');
        } else {
            const prod = products.find((p) => String(p.id) === String(value));
            if (prod) setSearch(prod.name);
        }
    }, [value, products]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Recalculate fixed position on scroll/resize so the dropdown tracks the input
    useEffect(() => {
        if (!open) return;
        const update = () => {
            if (!inputRef.current) return;
            const r = inputRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: top > 0 ? top : r.bottom + 2,
                left: r.left,
                width: Math.max(r.width, 280),
                zIndex: 9999,
            });
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    const filtered = useMemo(() => {
        if (!search) return products;
        const q = search.toLowerCase();
        return products.filter(
            (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
    }, [products, search]);

    const handleChange = (e) => {
        setSearch(e.target.value);
        setOpen(true);
        if (!e.target.value) onChange('');
    };

    const select = (p) => {
        onChange(String(p.id));
        setSearch(p.name);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <input
                ref={inputRef}
                type="text"
                placeholder="Tìm sản phẩm theo tên hoặc SKU…"
                value={search}
                onChange={handleChange}
                onFocus={() => setOpen(true)}
                autoComplete="off"
                className={`w-full bg-[#1a2035] border border-gray-700 rounded px-2 py-1 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 outline-none ${inputClassName}`}
            />
            {open && filtered.length > 0 && (
                <ul style={dropdownStyle} className="bg-[#1a2035] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filtered.map((p) => {
                        const inv = inventoryMap[p.id];
                        const outOfStock = inv && inv.stock_quantity < 1;
                        return (
                            <li
                                key={p.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => !outOfStock && select(p)}
                                className={`px-3 py-2 text-sm flex justify-between items-center gap-2 ${outOfStock
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:bg-gray-700/50 cursor-pointer'
                                    }`}
                            >
                                <span>
                                    <span className="font-medium text-gray-200">{p.name}</span>
                                    <span className="text-gray-500 text-xs ml-1.5">— {p.sku}</span>
                                </span>
                                <span className="shrink-0 text-xs space-x-1.5">
                                    {showPrice && (
                                        <span className="text-gray-400">{fmt(p.base_price)}đ</span>
                                    )}
                                    {inv !== undefined && (
                                        <span className={outOfStock ? 'text-red-400' : 'text-green-400'}>
                                            ({outOfStock ? 'Hết' : `còn ${inv.stock_quantity}`})
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
