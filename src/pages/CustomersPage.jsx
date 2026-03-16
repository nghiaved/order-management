import { useCallback } from 'react';
import { customerService } from '../services/customerService';
import { usePermissions } from '../hooks/usePermissions';
import { useCrudPage } from '../hooks/useCrudPage';
import { ConfirmModal } from '../components/Modal';
import Pagination from '../components/Pagination';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import CrudFormModal, { FormField, FormInput } from '../components/CrudFormModal';
import { fmtDateTime } from '../utils/format';

const EMPTY = { full_name: '', phone: '', address: '' };

const loadData = async () => {
    const data = await customerService.getAll();
    return [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};
const formFromItem = (c) => ({ full_name: c.full_name, phone: c.phone, address: c.address });
const payloadFromForm = (form) => form;

export default function CustomersPage() {
    const { canCreate, canEdit, canDelete } = usePermissions('customers');

    const filterFn = useCallback((items, search) => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter((c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address || '').toLowerCase().includes(q));
    }, []);

    const {
        filtered, paginated, page, setPage, totalPages,
        search, setSearch,
        editing, form, setForm, openNew, openEdit, close, handleSave, saving,
        deleteTarget, setDeleteTarget, confirmDelete,
    } = useCrudPage({
        loadData, emptyForm: EMPTY, formFromItem, payloadFromForm,
        createItem: (data) => customerService.create({ ...data, created_at: new Date().toISOString() }),
        updateItem: customerService.update,
        deleteItem: customerService.remove, filterFn,
    });

    const columns = [
        { header: 'Full Name', key: 'full_name', render: (c) => <span className="font-medium text-gray-200">{c.full_name}</span> },
        { header: 'Phone', key: 'phone', render: (c) => <span className="text-gray-300">{c.phone}</span> },
        { header: 'Address', key: 'address', render: (c) => <span className="text-gray-400">{c.address}</span> },
        { header: 'Created', key: 'created_at', render: (c) => <span className="text-gray-500 text-xs">{fmtDateTime(c.created_at)}</span> },
        ...((canEdit || canDelete) ? [{
            header: 'Actions', key: 'actions', width: '140px',
            render: (c) => (
                <div className="flex items-center justify-center gap-1.5">
                    {canEdit && <button onClick={() => openEdit(c)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Edit</button>}
                    {canDelete && <button onClick={() => setDeleteTarget(c)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Delete</button>}
                </div>
            ),
        }] : []),
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Customers</h1>
                {canCreate && (
                    <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-medium transition-colors">
                        + New Customer
                    </button>
                )}
            </div>

            <SearchFilter
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search by name, phone, or address…"
                resultCount={filtered.length}
            />

            <DataTable columns={columns} data={paginated} emptyText="No customers found." />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <CrudFormModal open={!!editing} onClose={close} onSubmit={handleSave} title={editing?.id ? 'Edit Customer' : 'New Customer'} saving={saving}>
                <FormField label="Full Name">
                    <FormInput value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </FormField>
                <FormField label="Phone">
                    <FormInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </FormField>
                <FormField label="Address" colSpan={2}>
                    <FormInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </FormField>
            </CrudFormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Customer"
                message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`} />
        </div>
    );
}
