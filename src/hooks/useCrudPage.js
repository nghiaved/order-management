import { useState, useEffect, useMemo, useCallback } from 'react';
import { PAGE_SIZE } from '../constants';

/**
 * Reusable hook for CRUD pages — eliminates duplicated state management
 * across ProductsPage, CustomersPage, and InventoryPage.
 *
 * SRP: Manages data lifecycle (load, filter, paginate, create, update, delete).
 * OCP: Extensible via config callbacks without modifying the hook.
 *
 * @param {Object} config
 * @param {Function} config.loadData       — async () => data[]
 * @param {Object}   config.emptyForm      — default form state for "new" mode
 * @param {Function} config.formFromItem   — (item) => formState
 * @param {Function} config.payloadFromForm — (form, isEdit) => apiPayload
 * @param {Function} config.createItem     — async (payload) => created
 * @param {Function} config.updateItem     — async (id, payload) => updated
 * @param {Function} config.deleteItem     — async (id) => void
 * @param {Function} config.filterFn       — (items, search) => filtered
 * @param {number}   [config.pageSize]     — items per page (default: PAGE_SIZE)
 */
export function useCrudPage({
    loadData,
    emptyForm,
    formFromItem,
    payloadFromForm,
    createItem,
    updateItem,
    deleteItem,
    filterFn,
    pageSize = PAGE_SIZE,
}) {
    const [data, setData] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = useCallback(async () => {
        setData(await loadData());
    }, [loadData]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(
        () => (filterFn ? filterFn(data, search) : data),
        [data, search, filterFn]
    );

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const openNew = useCallback(() => {
        setForm(emptyForm);
        setEditing({});
    }, [emptyForm]);

    const openEdit = useCallback((item) => {
        setForm(formFromItem(item));
        setEditing(item);
    }, [formFromItem]);

    const close = useCallback(() => {
        setEditing(null);
        setForm(emptyForm);
    }, [emptyForm]);

    const handleSave = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = payloadFromForm(form, !!editing?.id);
            if (editing?.id) {
                await updateItem(editing.id, payload);
            } else {
                await createItem(payload);
            }
            close();
            await load();
        } finally {
            setSaving(false);
        }
    }, [form, editing, payloadFromForm, updateItem, createItem, close, load]);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        await deleteItem(deleteTarget.id);
        setDeleteTarget(null);
        await load();
    }, [deleteTarget, deleteItem, load]);

    return {
        // Data
        data, setData, filtered, paginated, load,
        // Pagination
        page, setPage, totalPages,
        // Search
        search, setSearch,
        // CRUD modal
        editing, form, setForm, openNew, openEdit, close, handleSave, saving,
        // Delete
        deleteTarget, setDeleteTarget, confirmDelete,
    };
}
