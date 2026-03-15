import { useState, useMemo, useCallback } from 'react';
import { productService } from '../services/productService';
import { usePermissions } from '../hooks/usePermissions';
import { useCrudPage } from '../hooks/useCrudPage';
import { ConfirmModal } from '../components/Modal';
import Pagination from '../components/Pagination';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import CrudFormModal, { FormField, FormInput } from '../components/CrudFormModal';
import { fmt } from '../utils/format';

const EMPTY = { sku: '', name: '', base_price: '', category: '' };

const loadData = () => productService.getAll();
const formFromItem = (p) => ({ sku: p.sku, name: p.name, base_price: p.base_price, category: p.category });
const payloadFromForm = (form) => ({ ...form, base_price: Number(form.base_price) });

export default function ProductsPage() {
    const [categoryFilter, setCategoryFilter] = useState('');
    const { canCreate, canEdit, canDelete } = usePermissions('products');

    const filterFn = useCallback((items, search) => {
        let result = items;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
        if (categoryFilter) result = result.filter((p) => p.category === categoryFilter);
        return result;
    }, [categoryFilter]);

    const {
        data, filtered, paginated, page, setPage, totalPages,
        search, setSearch,
        editing, form, setForm, openNew, openEdit, close, handleSave, saving,
        deleteTarget, setDeleteTarget, confirmDelete,
    } = useCrudPage({
        loadData, emptyForm: EMPTY, formFromItem, payloadFromForm,
        createItem: productService.create, updateItem: productService.update,
        deleteItem: productService.remove, filterFn,
    });

    const categories = useMemo(() => [...new Set(data.map((p) => p.category).filter(Boolean))], [data]);

    const columns = [
        { header: 'SKU', key: 'sku', render: (p) => <span className="font-mono text-xs text-gray-300">{p.sku}</span> },
        { header: 'Name', key: 'name', render: (p) => <span className="font-medium text-gray-200">{p.name}</span> },
        { header: 'Category', key: 'category', render: (p) => <span className="text-gray-400">{p.category}</span> },
        { header: 'Base Price', key: 'base_price', render: (p) => <span className="text-gray-200 font-semibold">{fmt(p.base_price)} đ</span> },
        ...((canEdit || canDelete) ? [{
            header: 'Actions', key: 'actions', width: '140px',
            render: (p) => (
                <div className="flex items-center justify-center gap-1.5">
                    {canEdit && <button onClick={() => openEdit(p)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Edit</button>}
                    {canDelete && <button onClick={() => setDeleteTarget(p)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Delete</button>}
                </div>
            ),
        }] : []),
    ];

    const formFields = [
        { label: 'SKU', key: 'sku' },
        { label: 'Name', key: 'name' },
        { label: 'Base Price (đ)', key: 'base_price', type: 'number' },
        { label: 'Category', key: 'category' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Products</h1>
                {canCreate && (
                    <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
                        + New Product
                    </button>
                )}
            </div>

            <SearchFilter
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search by name or SKU…"
                filters={[{
                    value: categoryFilter,
                    onChange: (v) => { setCategoryFilter(v); setPage(1); },
                    options: [{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))],
                }]}
                resultCount={filtered.length}
            />

            <DataTable columns={columns} data={paginated} emptyText="No products found." />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <CrudFormModal open={!!editing} onClose={close} onSubmit={handleSave} title={editing?.id ? 'Edit Product' : 'New Product'} saving={saving}>
                {formFields.map((f) => (
                    <FormField key={f.key} label={f.label}>
                        <FormInput type={f.type || 'text'} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    </FormField>
                ))}
            </CrudFormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Product"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`} />
        </div>
    );
}
