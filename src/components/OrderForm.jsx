import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import { orderService } from '../services/orderService';
import { generateOrderId } from '../utils/generate';
import toast from 'react-hot-toast';
import { PAYMENT_METHODS, SHIPPING_UNITS, VAT_RATE } from '../constants';
import { fmt } from '../utils/format';

const makeEmptyForm = () => ({
    customer_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    shipping_unit: '',
    payment_method: 'COD',
    debt_days: '',
    bank_name: '',
    bank_account: '',
    prepaid_amount: '',
    shipping_fee: '',
    has_vat: false,
    note: '',
});

export default function OrderForm({ editingOrder, onSaved, onCancel }) {
    const [form, setForm] = useState(makeEmptyForm);
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventoryMap, setInventoryMap] = useState({});
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const dropdownRef = useRef(null);

    // ── Load reference data ─────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            const [c, p, inv] = await Promise.all([
                customerService.getAll(),
                productService.getAll(),
                inventoryService.getAll(),
            ]);
            setCustomers(c);
            setProducts(p);
            const map = {};
            inv.forEach((i) => (map[i.product_id] = i));
            setInventoryMap(map);
        };
        load();
    }, []);

    // ── Populate form when editing ──────────────────────────────────
    useEffect(() => {
        if (!editingOrder) {
            setForm(makeEmptyForm());
            setItems([]);
            setCustomerSearch('');
            setIsNewCustomer(false);
            return;
        }
        let bankName = '';
        let bankAccount = '';
        if (editingOrder.bank_info) {
            try {
                const parsed = JSON.parse(editingOrder.bank_info);
                bankName = parsed.bank_name || '';
                bankAccount = parsed.account_number || '';
            } catch {
                // not JSON
            }
        }
        setForm({
            customer_id: editingOrder.customer_id,
            delivery_date: editingOrder.delivery_date || '',
            shipping_unit: editingOrder.shipping_unit || '',
            payment_method: editingOrder.payment_method || 'COD',
            debt_days: editingOrder.debt_days || '',
            bank_name: bankName,
            bank_account: bankAccount,
            prepaid_amount: editingOrder.prepaid_amount || '',
            shipping_fee: editingOrder.shipping_fee || '',
            has_vat: editingOrder.has_vat || false,
            note: editingOrder.note || '',
        });
        const cust = customers.find((c) => c.id === editingOrder.customer_id);
        setCustomerSearch(cust ? cust.full_name : String(editingOrder.customer_id));
        // Load line items
        orderService.getOrderDetails(editingOrder.id).then((details) => {
            setItems(
                details.map((d) => ({
                    product_id: d.product_id,
                    quantity: d.quantity,
                    unit_price: d.unit_price,
                }))
            );
        });
    }, [editingOrder, customers]);

    // ── Close dropdown on outside click ─────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Filtered customers (autocomplete) ──────────────────────────
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers;
        const q = customerSearch.toLowerCase();
        return customers.filter(
            (c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q)
        );
    }, [customerSearch, customers]);

    // ── Calculations ────────────────────────────────────────────────
    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0),
        [items]
    );

    const vatAmount = useMemo(() => (form.has_vat ? subtotal * VAT_RATE : 0), [subtotal, form.has_vat]);

    const totalAmount = useMemo(
        () => subtotal + vatAmount + (Number(form.shipping_fee) || 0),
        [subtotal, vatAmount, form.shipping_fee]
    );

    const amountDue = useMemo(
        () => totalAmount - (Number(form.prepaid_amount) || 0),
        [totalAmount, form.prepaid_amount]
    );

    // ── Product line helpers ────────────────────────────────────────
    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: '' }]);
    }, []);

    const removeItem = useCallback((idx) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
    }, []);

    const updateItem = useCallback(
        (idx, field, value) => {
            setItems((prev) => {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], [field]: value };
                if (field === 'product_id') {
                    const prod = products.find((p) => String(p.id) === String(value));
                    if (prod) copy[idx].unit_price = prod.base_price;
                }
                return copy;
            });
        },
        [products]
    );

    // ── Validation ──────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.customer_id && !isNewCustomer) errs.customer = 'Vui lòng chọn hoặc thêm khách hàng';
        if (isNewCustomer && !newCustomer.full_name) errs.customer = 'Tên khách hàng là bắt buộc';
        if (isNewCustomer && newCustomer.phone && !/^\d{10}$/.test(String(newCustomer.phone).replace(/\s/g, '')))
            errs.phone = 'Số điện thoại phải đúng 10 chữ số';
        if (items.length === 0) errs.items = 'Thêm ít nhất một sản phẩm';
        items.forEach((item, i) => {
            if (!item.product_id) errs[`item_${i}`] = 'Vui lòng chọn sản phẩm';
            if (!item.quantity || item.quantity < 1) errs[`qty_${i}`] = 'Số lượng phải >= 1';
            // Inventory pre-check (new orders only)
            if (!editingOrder && item.product_id && Number(item.quantity) >= 1) {
                const inv = inventoryMap[item.product_id];
                if (inv && Number(item.quantity) > inv.stock_quantity) {
                    const prod = products.find((p) => String(p.id) === String(item.product_id));
                    errs[`qty_${i}`] = `Không đủ tồn kho — chỉ còn ${inv.stock_quantity}${prod ? ` cho ${prod.name}` : ''}`;
                }
            }
        });
        if (form.payment_method === 'Công nợ' && !form.debt_days) errs.debt_days = 'Số ngày nợ là bắt buộc';
        if (form.payment_method === 'Chuyển khoản') {
            if (!form.bank_name) errs.bank_name = 'Tên ngân hàng là bắt buộc';
            if (!form.bank_account) errs.bank_account = 'Số tài khoản là bắt buộc';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ──────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);

        try {
            let customerId = form.customer_id;

            if (isNewCustomer) {
                const created = await customerService.create(newCustomer);
                customerId = created.id;
                setCustomers((prev) => [...prev, created]);
            }

            const bankInfo =
                form.payment_method === 'Chuyển khoản'
                    ? JSON.stringify({ bank_name: form.bank_name, account_number: form.bank_account })
                    : '';

            const orderPayload = {
                customer_id: customerId,
                delivery_date: form.delivery_date,
                shipping_unit: form.shipping_unit,
                payment_method: form.payment_method,
                debt_days: form.payment_method === 'Công nợ' ? Number(form.debt_days) : 0,
                bank_info: bankInfo,
                prepaid_amount: Number(form.prepaid_amount) || 0,
                shipping_fee: Number(form.shipping_fee) || 0,
                has_vat: form.has_vat,
                note: form.note,
                total_amount: totalAmount,
            };

            if (editingOrder) {
                await orderService.update(editingOrder.id, orderPayload);
                await orderService.deleteOrderDetails(editingOrder.id);
                await Promise.all(
                    items.map((item) =>
                        orderService.createOrderDetail({
                            order_id: editingOrder.id,
                            product_id: Number(item.product_id),
                            quantity: Number(item.quantity),
                            unit_price: Number(item.unit_price),
                        })
                    )
                );
            } else {
                const existingOrders = await orderService.getAll();
                const orderId = generateOrderId(existingOrders);

                await orderService.create({ ...orderPayload, id: orderId, status: 'New' });
                await Promise.all(
                    items.map((item) =>
                        orderService.createOrderDetail({
                            order_id: orderId,
                            product_id: Number(item.product_id),
                            quantity: Number(item.quantity),
                            unit_price: Number(item.unit_price),
                        })
                    )
                );

                // Deduct inventory
                for (const item of items) {
                    await inventoryService.deductStock(Number(item.product_id), Number(item.quantity));
                }
            }

            setForm(makeEmptyForm());
            setItems([]);
            setCustomerSearch('');
            setIsNewCustomer(false);
            setNewCustomer({ full_name: '', phone: '', address: '' });
            toast.success(editingOrder ? 'Cập nhật đơn hàng thành công!' : 'Tạo đơn hàng thành công!');
            onSaved?.();
        } catch (err) {
            toast.error(err.message || 'Không thể lưu đơn hàng.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#111827] rounded-xl border border-gray-700/50 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">
                {editingOrder ? `Sửa đơn hàng: ${editingOrder.id}` : 'Tạo đơn hàng mới'}
            </h2>

            {/* ── Customer ──────────────────────────────────────────── */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-300">Khách hàng</legend>

                {!isNewCustomer ? (
                    <div className="relative" ref={dropdownRef}>
                        <input
                            type="text"
                            placeholder="Tìm khách hàng theo tên hoặc số điện thoại…"
                            className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setShowCustomerDropdown(true);
                                setForm((f) => ({ ...f, customer_id: '' }));
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                        />
                        {showCustomerDropdown && filteredCustomers.length > 0 && (
                            <ul className="absolute z-10 w-full bg-[#1a2035] border border-gray-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                {filteredCustomers.map((c) => (
                                    <li
                                        key={c.id}
                                        className="px-3 py-2 hover:bg-gray-700/50 cursor-pointer text-sm text-gray-200"
                                        onClick={() => {
                                            setForm((f) => ({ ...f, customer_id: c.id }));
                                            setCustomerSearch(c.full_name);
                                            setShowCustomerDropdown(false);
                                        }}
                                    >
                                        <span className="font-medium">{c.full_name}</span>
                                        <span className="text-gray-500 ml-2">– {c.phone}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button
                            type="button"
                            className="mt-1 text-sm text-blue-600 hover:underline"
                            onClick={() => setIsNewCustomer(true)}
                        >
                            + Thêm khách hàng mới
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            placeholder="Họ tên *"
                            className="bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                            value={newCustomer.full_name}
                            onChange={(e) => setNewCustomer((n) => ({ ...n, full_name: e.target.value }))}
                        />
                        <div>
                            <input
                                placeholder="SĐT (10 số)"
                                className={`w-full bg-[#1a2035] border rounded-lg px-3 py-2 text-white placeholder-gray-500 ${errors.phone ? 'border-red-500' : 'border-gray-700'}`}
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer((n) => ({ ...n, phone: e.target.value }))}
                            />
                            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <input
                            placeholder="Địa chỉ"
                            className="bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer((n) => ({ ...n, address: e.target.value }))}
                        />
                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:underline"
                            onClick={() => {
                                setIsNewCustomer(false);
                                setNewCustomer({ full_name: '', phone: '', address: '' });
                            }}
                        >
                            ← Chọn khách hàng cũ
                        </button>
                    </div>
                )}
                {errors.customer && <p className="text-red-400 text-xs">{errors.customer}</p>}
            </fieldset>

            {/* ── Shipping & Payment ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ngày giao hàng</label>
                    <input
                        type="date"
                        className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        value={form.delivery_date}
                        onChange={(e) => setForm((f) => ({ ...f, delivery_date: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Đơn vị vận chuyển</label>
                    <select
                        className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        value={form.shipping_unit}
                        onChange={(e) => setForm((f) => ({ ...f, shipping_unit: e.target.value }))}
                    >
                        <option value="">-- Select --</option>
                        {SHIPPING_UNITS.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phương thức thanh toán</label>
                    <select
                        className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        value={form.payment_method}
                        onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                    >
                        {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Conditional: Credit → Debt Days ───────────────────── */}
            {form.payment_method === 'Công nợ' && (
                <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Số ngày nợ</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        value={form.debt_days}
                        onChange={(e) => setForm((f) => ({ ...f, debt_days: e.target.value }))}
                    />
                    {errors.debt_days && <p className="text-red-400 text-xs mt-1">{errors.debt_days}</p>}
                </div>
            )}

            {/* ── Conditional: Transfer → Bank Info ─────────────────── */}
            {form.payment_method === 'Chuyển khoản' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tên ngân hàng</label>
                        <input
                            className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={form.bank_name}
                            onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                        />
                        {errors.bank_name && <p className="text-red-400 text-xs mt-1">{errors.bank_name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Số tài khoản</label>
                        <input
                            className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={form.bank_account}
                            onChange={(e) => setForm((f) => ({ ...f, bank_account: e.target.value }))}
                        />
                        {errors.bank_account && <p className="text-red-400 text-xs mt-1">{errors.bank_account}</p>}
                    </div>
                </div>
            )}

            {/* ── Product Lines ─────────────────────────────────────── */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-300">Sản phẩm</legend>
                {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#1a2035] text-left text-gray-400">
                                <th className="px-3 py-2">Sản phẩm</th>
                                <th className="px-3 py-2 w-24">SL</th>
                                <th className="px-3 py-2 w-32">Đơn giá</th>
                                <th className="px-3 py-2 w-24">Tồn kho</th>
                                <th className="px-3 py-2 w-32">Thành tiền</th>
                                <th className="px-3 py-2 w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const stock = inventoryMap[item.product_id];
                                const baseProd = item.product_id ? products.find((p) => String(p.id) === String(item.product_id)) : null;

                                return (
                                    <tr key={idx} className="border-t border-gray-700/50">
                                        <td className="px-3 py-2">
                                            <select
                                                className="w-full bg-[#1a2035] border border-gray-700 rounded px-2 py-1 text-white"
                                                value={item.product_id}
                                                onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                                            >
                                                <option value="">-- Chọn --</option>
                                                {products.map((p) => {
                                                    const stock = inventoryMap[p.id];
                                                    return (
                                                        <option disabled={!stock || !stock.stock_quantity} key={p.id} value={p.id}>
                                                            {p.sku} – {p.name} - {fmt(p.base_price)} đ ({stock ? `còn ${stock.stock_quantity}` : 'Hết hàng'})
                                                        </option>
                                                    )
                                                })}
                                            </select>
                                            {errors[`item_${idx}`] && (
                                                <p className="text-red-400 text-xs">{errors[`item_${idx}`]}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full bg-[#1a2035] border border-gray-700 rounded px-2 py-1 text-white"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full bg-[#1a2035] border border-gray-700 rounded px-2 py-1 text-white"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                            />
                                            {baseProd && (
                                                <p className="text-xs text-gray-500 mt-0.5">Gốc: {fmt(baseProd.base_price)} VNĐ</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {stock ? (
                                                <span
                                                    className={
                                                        stock.stock_quantity < Number(item.quantity)
                                                            ? 'text-red-600 font-semibold'
                                                            : 'text-green-600'
                                                    }
                                                >
                                                    {stock.stock_quantity}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-200">
                                            {fmt((Number(item.unit_price) || 0) * (Number(item.quantity) || 0))}
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">
                    + Thêm dòng sản phẩm
                </button>
            </fieldset>

            {/* ── Totals & Extras ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-300">VAT (10%)</label>
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded"
                            checked={form.has_vat}
                            onChange={(e) => setForm((f) => ({ ...f, has_vat: e.target.checked }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Phí vận chuyển</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={form.shipping_fee}
                            onChange={(e) => setForm((f) => ({ ...f, shipping_fee: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tiền trả trước</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={form.prepaid_amount}
                            onChange={(e) => setForm((f) => ({ ...f, prepaid_amount: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label>
                        <textarea
                            rows={2}
                            className="w-full bg-[#1a2035] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            value={form.note}
                            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="bg-[#1a2035] rounded-lg p-4 space-y-2 text-sm self-start border border-gray-700/50">
                    <div className="flex justify-between text-gray-300">
                        <span>Tạm tính</span>
                        <span className="font-medium">{fmt(subtotal)} VNĐ</span>
                    </div>
                    {form.has_vat && (
                        <div className="flex justify-between text-green-400">
                            <span>VAT (10%)</span>
                            <span>+{fmt(vatAmount)} VNĐ</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-300">
                        <span>Phí vận chuyển</span>
                        <span>+{fmt(Number(form.shipping_fee) || 0)} VNĐ</span>
                    </div>
                    <hr className="border-gray-700" />
                    <div className="flex justify-between font-semibold text-base text-white">
                        <span>Tổng cộng</span>
                        <span>{fmt(totalAmount)} VNĐ</span>
                    </div>
                    {Number(form.prepaid_amount) > 0 && (
                        <>
                            <div className="flex justify-between text-blue-400">
                                <span>Trả trước</span>
                                <span>−{fmt(form.prepaid_amount)} VNĐ</span>
                            </div>
                            <div className="flex justify-between font-semibold text-orange-400">
                                <span>Còn lại</span>
                                <span>{fmt(amountDue)} VNĐ</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Actions ───────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg font-medium disabled:opacity-50"
                >
                    {saving ? 'Đang lưu…' : editingOrder ? 'Cập nhật' : 'Tạo đơn'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="border border-gray-600 text-gray-300 px-6 py-1.5 rounded-lg hover:bg-gray-700/50"
                    >
                        Hủy
                    </button>
                )}
            </div>
        </form>
    );
}
