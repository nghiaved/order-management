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
        loading, filtered, paginated, page, setPage, totalPages,
        search, setSearch,
        editing, form, setForm, openNew, openEdit, close, handleSave, saving,
        deleteTarget, setDeleteTarget, confirmDelete, deleting,
    } = useCrudPage({
        loadData, emptyForm: EMPTY, formFromItem, payloadFromForm,
        createItem: (data) => customerService.create({ ...data, created_at: new Date().toISOString() }),
        updateItem: customerService.update,
        deleteItem: customerService.remove, filterFn,
    });

    const columns = [
        { header: 'Họ tên', key: 'full_name', render: (c) => <span className="font-medium text-gray-200">{c.full_name}</span> },
        { header: 'SĐT', key: 'phone', render: (c) => <span className="text-gray-300">{c.phone}</span> },
        { header: 'Địa chỉ', key: 'address', render: (c) => <span className="text-gray-400">{c.address}</span> },
        { header: 'Ngày tạo', key: 'created_at', render: (c) => <span className="text-gray-500 text-xs">{fmtDateTime(c.created_at)}</span> },
        ...((canEdit || canDelete) ? [{
            header: 'Thao tác', key: 'actions', width: '140px',
            render: (c) => (
                <div className="flex items-center justify-center gap-1.5">
                    {canEdit && <button onClick={() => openEdit(c)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Sửa</button>}
                    {canDelete && <button onClick={() => setDeleteTarget(c)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Xóa</button>}
                </div>
            ),
        }] : []),
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Khách hàng</h1>
                {canCreate && (
                    <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-medium transition-colors">
                        + Thêm khách hàng
                    </button>
                )}
            </div>

            <SearchFilter
                search={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Tìm theo tên, SĐT hoặc địa chỉ…"
                resultCount={filtered.length}
            />

            {loading ? (
                <div className="bg-[#111827] border border-gray-700/50 rounded-xl overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-800/50">
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse flex-1" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-28" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-40" />
                            <div className="h-3 bg-gray-700/50 rounded animate-pulse w-32" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <DataTable columns={columns} data={paginated} emptyText="Không tìm thấy khách hàng." />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            <CrudFormModal open={!!editing} onClose={close} onSubmit={handleSave} title={editing?.id ? 'Sửa khách hàng' : 'Thêm khách hàng'} saving={saving}>
                <FormField label="Họ tên">
                    <FormInput value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </FormField>
                <FormField label="SĐT">
                    <FormInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </FormField>
                <FormField label="Địa chỉ" colSpan={2}>
                    <FormInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </FormField>
            </CrudFormModal>

            <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Xóa khách hàng"
                message={`Bạn có chắc chắn muốn xóa "${deleteTarget?.full_name}"? Thao tác này không thể hoàn tác.`} deleting={deleting} />
        </div>
    );
}
