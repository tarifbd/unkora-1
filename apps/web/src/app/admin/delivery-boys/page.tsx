'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Bike } from 'lucide-react';
import { deliveryBoysApi } from '@/lib/api/admin';

interface DeliveryBoy {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  area?: string;
  vehicleType?: string;
  status: string;
  totalDeliveries?: number;
}

interface DeliveryBoysData {
  deliveryBoys?: DeliveryBoy[];
  items?: DeliveryBoy[];
  total?: number;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  area: string;
  vehicleType: string;
}

const defaultForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  area: '',
  vehicleType: 'Motorcycle',
};

const VEHICLE_TYPES = ['Bicycle', 'Motorcycle', 'Car', 'Van', 'Other'];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:       'bg-green-100 text-green-700',
  ON_DELIVERY:  'bg-blue-100 text-blue-700',
  INACTIVE:     'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:      'Active',
  ON_DELIVERY: 'On Delivery',
  INACTIVE:    'Inactive',
};

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function AdminDeliveryBoysPage() {
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: DeliveryBoysData = await deliveryBoysApi.list();
      const list = data?.deliveryBoys ?? data?.items ?? (Array.isArray(data) ? (data as DeliveryBoy[]) : []);
      setBoys(list);
    } catch {
      setError('Failed to load delivery boys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (boy: DeliveryBoy) => {
    setEditId(boy.id);
    setForm({
      firstName: boy.firstName,
      lastName: boy.lastName,
      email: boy.email,
      password: '',
      phone: boy.phone ?? '',
      area: boy.area ?? '',
      vehicleType: boy.vehicleType ?? 'Motorcycle',
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(null); };

  const handleSave = async () => {
    if (!form.firstName.trim()) { setFormError('First name is required'); return; }
    if (!form.lastName.trim()) { setFormError('Last name is required'); return; }
    if (!form.email.trim()) { setFormError('Email is required'); return; }
    if (!editId && !form.password.trim()) { setFormError('Password is required'); return; }

    setSaving(true);
    setFormError(null);
    try {
      if (editId) {
        const payload: Record<string, string> = {
          phone: form.phone,
          area: form.area,
          vehicleType: form.vehicleType,
        };
        await deliveryBoysApi.update(editId, payload);
      } else {
        await deliveryBoysApi.create({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone,
          area: form.area,
          vehicleType: form.vehicleType,
        });
      }
      closeModal();
      void load();
    } catch {
      setFormError('Failed to save. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (boy: DeliveryBoy) => {
    if (!confirm(`Deactivate ${boy.firstName} ${boy.lastName}?`)) return;
    try {
      await deliveryBoysApi.update(boy.id, { status: 'INACTIVE' });
      setBoys(prev => prev.map(b => b.id === boy.id ? { ...b, status: 'INACTIVE' } : b));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery boy?')) return;
    setDeletingId(id);
    try {
      await deliveryBoysApi.remove(id);
      setBoys(prev => prev.filter(b => b.id !== id));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const total    = boys.length;
  const active   = boys.filter(b => b.status === 'ACTIVE').length;
  const onDelivery = boys.filter(b => b.status === 'ON_DELIVERY').length;
  const inactive = boys.filter(b => b.status === 'INACTIVE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Delivery Boys</h1>
          <p className="text-sm text-muted-foreground">Manage your delivery fleet</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Delivery Boy
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{total}</p>
          <p className="text-xs font-medium text-blue-700 mt-0.5">Total</p>
        </div>
        <div className="rounded-xl border p-4 bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{active}</p>
          <p className="text-xs font-medium text-green-700 mt-0.5">Active</p>
        </div>
        <div className="rounded-xl border p-4 bg-indigo-50 border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">{onDelivery}</p>
          <p className="text-xs font-medium text-indigo-700 mt-0.5">On Delivery</p>
        </div>
        <div className="rounded-xl border p-4 bg-gray-50 border-gray-200">
          <p className="text-2xl font-bold text-gray-600">{inactive}</p>
          <p className="text-xs font-medium text-gray-600 mt-0.5">Inactive</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : boys.length === 0 ? (
          <div className="py-16 text-center">
            <Bike className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold">No delivery boys yet</p>
            <p className="text-sm text-muted-foreground">Add your first delivery personnel</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Email</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Phone</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Area</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Deliveries</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {boys.map(boy => {
                  const badgeCls = STATUS_BADGE[boy.status] ?? 'bg-muted text-muted-foreground';
                  const statusLabel = STATUS_LABEL[boy.status] ?? boy.status;
                  return (
                    <tr key={boy.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{boy.firstName} {boy.lastName}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{boy.email}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{boy.phone ?? '—'}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{boy.area ?? '—'}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{boy.vehicleType ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {boy.totalDeliveries ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(boy)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {boy.status !== 'INACTIVE' && (
                            <button
                              onClick={() => handleDeactivate(boy)}
                              className="rounded-md px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors"
                              title="Deactivate"
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(boy.id)}
                            disabled={deletingId === boy.id}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === boy.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-card shadow-2xl border">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">{editId ? 'Edit Delivery Boy' : 'Add Delivery Boy'}</h2>
              <button onClick={closeModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">First Name <span className="text-destructive">*</span></label>
                  <input
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    disabled={!!editId}
                    placeholder="First name"
                    className={`${inputCls} disabled:opacity-60`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Last Name <span className="text-destructive">*</span></label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    disabled={!!editId}
                    placeholder="Last name"
                    className={`${inputCls} disabled:opacity-60`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Email <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  disabled={!!editId}
                  placeholder="delivery@example.com"
                  className={`${inputCls} disabled:opacity-60`}
                />
              </div>

              {!editId && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Password <span className="text-destructive">*</span></label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Set a password"
                    className={inputCls}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+880 1700 000000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Service Area</label>
                  <input
                    value={form.area}
                    onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="e.g. Gulshan, Dhaka"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Vehicle Type</label>
                <select
                  value={form.vehicleType}
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                  className={inputCls}
                >
                  {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>

              {formError && <p className="text-xs text-destructive">{formError}</p>}
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Add Delivery Boy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
