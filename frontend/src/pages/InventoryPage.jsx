import { useState, useEffect, useMemo, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import ProductSearchInput from '../components/ProductSearchInput';
import { usePermissions } from '../hooks/usePermissions';
import { ConfirmModal } from '../components/Modal';
import Pagination from '../components/Pagination';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import CrudFormModal, { FormField, FormInput } from '../components/CrudFormModal';
import { PAGE_SIZE } from '../constants';
import { fmt, fmtDateTime } from '../utils/format';

const EMPTY = { product_id: '', stock_quantity: '', location: '' };

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({ stock_quantity: '', location: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const { canCreate, canEdit, canDelete } = usePermissions('inventory');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [inv, prod] = await Promise.all([inventoryService.getAll(), productService.getAll()]);
            setInventory(inv?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setProducts(prod);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const productMap = useMemo(() => {
        const m = {};
        products.forEach((p) => (m[p.id] = p));
        return m;
    }, [products]);

    const locations = useMemo(() => [...new Set(inventory.map((i) => i.location).filter(Boolean))], [inventory]);

    const filtered = useMemo(() => {
        let result = inventory;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter((item) => {
                const prod = productMap[item.product_id];
                return (prod?.name || '').toLowerCase().includes(q) || (prod?.sku || '').toLowerCase().includes(q);
            });
        }
        if (locationFilter) result = result.filter((item) => item.location === locationFilter);
        return result;
    }, [inventory, search, locationFilter, productMap]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openEdit = (item) => {
        setEditing(item);
        setEditForm({ stock_quantity: item.stock_quantity, location: item.location });
    };
    const closeEdit = () => setEditing(null);

    const saveEdit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        try {
            await inventoryService.update(editing.id, {
                ...editing,
                stock_quantity: Number(editForm.stock_quantity),
                location: editForm.location,
                last_updated: new Date().toISOString(),
            });
            closeEdit();
            load();
        } finally {
            setSavingEdit(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await inventoryService.create({
                product_id: createForm.product_id,
                stock_quantity: Number(createForm.stock_quantity),
                location: createForm.location,
            });
            setShowCreate(false);
            setCreateForm(EMPTY);
            load();
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await inventoryService.remove(deleteTarget.id);
            setDeleteTarget(null);
            load();
        } finally {
            setDeleting(false);
        }
    };

    const stockColor = (qty) => qty < 20 ? 'text-red-400' : qty < 100 ? 'text-yellow-400' : 'text-green-400';

    const columns = [
        { header: 'SKU', key: 'sku', render: (item) => <span className="font-mono text-xs text-gray-300">{productMap[item.product_id]?.sku || '—'}</span> },
        { header: 'Sản phẩm', key: 'product', render: (item) => <span className="font-medium text-gray-200">{productMap[item.product_id]?.name || '—'}</span> },
        { header: 'Danh mục', key: 'category', render: (item) => <span className="text-gray-400">{productMap[item.product_id]?.category || '—'}</span> },
        { header: 'Giá gốc', key: 'price', render: (item) => { const p = productMap[item.product_id]; return <span className="text-gray-200">{p ? fmt(p.base_price) + ' VNĐ' : '—'}</span>; } },
        { header: 'Tồn kho', key: 'stock_quantity', render: (item) => <span className={`font-semibold ${stockColor(item.stock_quantity)}`}>{item.stock_quantity}</span> },
        { header: 'Vị trí', key: 'location', render: (item) => <span className="text-gray-400">{item.location}</span> },
        { header: 'Cập nhật', key: 'last_updated', render: (item) => <span className="text-gray-500 text-xs">{fmtDateTime(item.last_updated)}</span> },
        ...((canEdit || canDelete) ? [{
            header: 'Thao tác', key: 'actions', width: '140px',
            render: (item) => (
                <div className="flex items-center justify-center gap-1.5">
                    {canEdit && <button onClick={() => openEdit(item)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Sửa</button>}
                    {canDelete && <button onClick={() => setDeleteTarget(item)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Xóa</button>}
                </div>
            ),
        }] : []),
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Kho hàng</h1>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-medium transition-colors">
                        + Thêm tồn kho
                    </button>
                )}
            </div>

            <SearchFilter
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Tìm theo tên sản phẩm hoặc SKU…"
                filters={[{
                    value: locationFilter,
                    onChange: (v) => { setLocationFilter(v); setPage(1); },
                    options: [{ value: '', label: 'Tất cả vị trí' }, ...locations.map((l) => ({ value: l, label: l }))],
                }]}
                resultCount={filtered.length}
            />

            {loading ? (
                <div className="bg-[#111827] border border-gray-700/50 rounded-xl overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-800/50">
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-24" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse flex-1" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-28" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-20" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-16" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-20" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <DataTable columns={columns} data={paginated} emptyText="Không tìm thấy tồn kho." />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            {/* ── Create Modal ────────────────────────────────── */}
            <CrudFormModal open={showCreate} onClose={() => { setShowCreate(false); setCreateForm(EMPTY); }} onSubmit={handleCreate} title="Thêm tồn kho" saving={saving}>
                <FormField label="Sản phẩm" colSpan={2}>
                    <ProductSearchInput
                        products={products}
                        value={createForm.product_id}
                        onChange={(id) => setCreateForm({ ...createForm, product_id: id })}
                        inputClassName="bg-[#0a0e1a] border-gray-700/50 rounded-xl px-4 py-1.5 focus:ring-2 focus:ring-blue-500/40"
                        showPrice={false}
                        top={478}
                    />
                    {!createForm.product_id && <input required className="sr-only" tabIndex={-1} aria-hidden />}
                </FormField>
                <FormField label="Số lượng tồn">
                    <FormInput type="number" value={createForm.stock_quantity} onChange={(e) => setCreateForm({ ...createForm, stock_quantity: e.target.value })} />
                </FormField>
                <FormField label="Vị trí">
                    <FormInput value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} placeholder="Ví dụ: Kho A" />
                </FormField>
            </CrudFormModal>

            {/* ── Edit Modal ──────────────────────────────────── */}
            <CrudFormModal open={!!editing} onClose={closeEdit} onSubmit={saveEdit} title={`Sửa tồn kho — ${productMap[editing?.product_id]?.name || ''}`} saving={savingEdit}>
                <FormField label="Số lượng tồn">
                    <FormInput type="number" value={editForm.stock_quantity} onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })} />
                </FormField>
                <FormField label="Vị trí">
                    <FormInput value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </FormField>
            </CrudFormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Xóa tồn kho"
                message={`Bạn có chắc chắn muốn xóa tồn kho của "${productMap[deleteTarget?.product_id]?.name || ''}"? Thao tác này không thể hoàn tác.`} deleting={deleting} />
        </div>
    );
}
