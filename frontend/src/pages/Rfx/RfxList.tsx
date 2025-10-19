import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRfx, listRfx, type Rfx, updateRfx } from '../../api/rfx';
import { useAuth } from '../../providers/AuthProvider';
import { z } from 'zod';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const rfxFormSchema = z.object({
  org_id: z.number().int().positive(),
  type: z.enum(['rfi', 'rfp', 'rfq']),
  title: z.string().min(3),
  due_at: z.string().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  notes: z.string().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

type RfxForm = z.input<typeof rfxFormSchema>;

export function RfxList() {
  const [statusFilter, setStatusFilter] = useState<'open' | 'draft' | 'submitted' | 'all'>('open');
  const [form, setForm] = useState<RfxForm>({ org_id: 0, type: 'rfp', title: '', due_at: '', notes: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof RfxForm, string>>>({});
  const [editing, setEditing] = useState<Rfx | null>(null);
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['rfx', statusFilter],
    queryFn: () =>
      listRfx({
        status: statusFilter === 'all' ? undefined : (statusFilter as any),
        owner_id: 'me',
        page: 1,
        limit: 50,
      }),
    staleTime: 30 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: z.infer<typeof rfxFormSchema>) => {
      if (editing) {
        return updateRfx(editing.id, payload);
      }
      return createRfx(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfx'] });
      setForm({ org_id: 0, type: 'rfp', title: '', due_at: '', notes: '' });
      setEditing(null);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = rfxFormSchema.safeParse({
      ...form,
      org_id: Number(form.org_id),
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof RfxForm, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof RfxForm;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await saveMutation.mutateAsync(parsed.data);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">RFx</h1>
          <p className="text-sm text-slate-400">Track RFIs, RFPs, and RFQs throughout the sales cycle.</p>
        </div>
        {hasPermission('rfx.create') ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ org_id: 0, type: 'rfp', title: '', due_at: '', notes: '' });
            }}
            className="rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            New RFx
          </button>
        ) : null}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm text-slate-300">Status</label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>

      {hasPermission('rfx.create') ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded border border-slate-800 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Organization ID"
              type="number"
              value={form.org_id}
              onChange={(value) => setForm((prev) => ({ ...prev, org_id: Number(value) }))}
              error={errors.org_id}
            />
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400">Type</label>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Rfx['type'] }))}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              >
                <option value="rfi">RFI</option>
                <option value="rfp">RFP</option>
                <option value="rfq">RFQ</option>
              </select>
            </div>
          </div>
          <Field
            label="Title"
            value={form.title}
            onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
            error={errors.title}
          />
          <Field
            label="Due Date"
            type="date"
            value={form.due_at ?? ''}
            onChange={(value) => setForm((prev) => ({ ...prev, due_at: value }))}
            error={errors.due_at}
          />
          <Field
            label="Notes"
            as="textarea"
            value={form.notes ?? ''}
            onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
            error={errors.notes}
          />
          <button
            type="submit"
            className="justify-self-start rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : editing ? 'Update RFx' : 'Create RFx'}
          </button>
        </form>
      ) : null}

      <div className="mt-8 overflow-hidden rounded border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading RFx…
                </td>
              </tr>
            ) : data?.data?.length ? (
              data.data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/60">
                  <td className="px-4 py-3">
                    <Link className="text-sky-400 hover:underline" to={`/rfx/${item.id}`}>
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 uppercase">{item.type}</td>
                  <td className="px-4 py-3 capitalize">{item.status}</td>
                  <td className="px-4 py-3">
                    {item.due_at ? format(new Date(item.due_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {hasPermission('rfx.create') ? (
                      <button
                        type="button"
                        className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        onClick={() => {
                          setEditing(item);
                          setForm({
                            org_id: item.org_id,
                            type: item.type,
                            title: item.title,
                            due_at: item.due_at ?? '',
                            notes: item.notes ?? '',
                          });
                        }}
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">View only</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No RFx found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  as = 'input',
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  as?: 'input' | 'textarea';
  type?: string;
}) {
  const Component = as as any;
  return (
    <label className="block text-xs uppercase tracking-wide text-slate-400">
      {label}
      <Component
        type={as === 'input' ? type : undefined}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
      />
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </label>
  );
}
