import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOrganization,
  deleteOrganization,
  listOrganizations,
  type Organization,
  type PaginatedOrganizations,
} from '../../api/organizations';
import { useAuth } from '../../providers/AuthProvider';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['client', 'vendor']),
  website: z.string().url().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  country_code: z.string().length(2).optional().or(z.literal('')).transform((val) => (val ? val.toUpperCase() : undefined)),
  timezone: z.string().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  notes: z.string().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

type CreateOrganizationForm = z.input<typeof createOrganizationSchema>;

export function OrganizationsList() {
  const [typeFilter, setTypeFilter] = useState<'client' | 'vendor' | 'all'>('client');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CreateOrganizationForm>({ name: '', type: 'client', website: '', country_code: '', timezone: '', notes: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateOrganizationForm, string>>>({});
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', typeFilter],
    queryFn: () =>
      listOrganizations({
        type: typeFilter === 'all' ? undefined : typeFilter,
        page: 1,
        limit: 50,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const organizations = useMemo(() => data?.data ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: (created) => {
      queryClient.setQueryData<PaginatedOrganizations | undefined>(
        ['organizations', typeFilter],
        (oldData) => {
          if (typeFilter !== 'all' && created.type !== typeFilter) {
            return oldData;
          }

          if (!oldData) {
            return {
              data: [created],
              total: 1,
              page: 1,
              limit: 50,
            };
          }

          return {
            ...oldData,
            data: [created, ...oldData.data],
            total: oldData.total + 1,
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setFormOpen(false);
      setForm({ name: '', type: 'client', website: '', country_code: '', timezone: '', notes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onMutate: async (organizationId: number) => {
      await queryClient.cancelQueries({ queryKey: ['organizations', typeFilter] });
      const previous = queryClient.getQueryData<PaginatedOrganizations | undefined>([
        'organizations',
        typeFilter,
      ]);
      queryClient.setQueryData<PaginatedOrganizations | undefined>(['organizations', typeFilter], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((item: Organization) => item.id !== organizationId),
          total: Math.max((oldData.total ?? 1) - 1, 0),
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['organizations', typeFilter], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = createOrganizationSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CreateOrganizationForm, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof CreateOrganizationForm;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await createMutation.mutateAsync(parsed.data);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Organizations</h1>
          <p className="text-sm text-slate-400">Manage clients and vendors participating in deals.</p>
        </div>
        {hasPermission('rfx.create') ? (
          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            {formOpen ? 'Close' : 'New Organization'}
          </button>
        ) : null}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm text-slate-300">Filter</label>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        >
          <option value="all">All</option>
          <option value="client">Clients</option>
          <option value="vendor">Vendors</option>
        </select>
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded border border-slate-800 p-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            {errors.name ? <p className="mt-1 text-xs text-rose-400">{errors.name}</p> : null}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'client' | 'vendor' }))}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="client">Client</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Website"
              value={form.website ?? ''}
              error={errors.website}
              onChange={(value) => setForm((prev) => ({ ...prev, website: value }))}
            />
            <Field
              label="Country"
              value={form.country_code ?? ''}
              error={errors.country_code}
              onChange={(value) => setForm((prev) => ({ ...prev, country_code: value }))}
            />
          </div>
          <Field
            label="Timezone"
            value={form.timezone ?? ''}
            error={errors.timezone}
            onChange={(value) => setForm((prev) => ({ ...prev, timezone: value }))}
          />
          <Field
            label="Notes"
            value={form.notes ?? ''}
            error={errors.notes}
            as="textarea"
            onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
          />
          <button
            type="submit"
            className="justify-self-start rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving…' : 'Create'}
          </button>
        </form>
      ) : null}

      <div className="mt-8 overflow-hidden rounded border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Timezone</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Loading organizations…
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No organizations found.
                </td>
              </tr>
            ) : (
              organizations.map((organization) => (
                <OrganizationRow
                  key={organization.id}
                  organization={organization}
                  canDelete={hasPermission('rfx.create')}
                  onDelete={(organizationId) => deleteMutation.mutateAsync(organizationId)}
                />
              ))
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
  error,
  as = 'input',
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  as?: 'input' | 'textarea';
  onChange: (value: string) => void;
}) {
  const Component = as as any;
  return (
    <label className="block text-xs uppercase tracking-wide text-slate-400">
      {label}
      <Component
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
      />
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </label>
  );
}

function OrganizationRow({
  organization,
  canDelete,
  onDelete,
}: {
  organization: Organization;
  canDelete: boolean;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <tr className="hover:bg-slate-800/60">
      <td className="px-4 py-3">
        <Link className="text-sky-400 hover:underline" to={`/organizations/${organization.id}`}>
          {organization.name}
        </Link>
      </td>
      <td className="px-4 py-3 capitalize">{organization.type}</td>
      <td className="px-4 py-3">{organization.timezone ?? '—'}</td>
      <td className="px-4 py-3">
        {canDelete ? (
          <button
            type="button"
            className="rounded border border-rose-500 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
            onClick={() => void onDelete(organization.id)}
          >
            Delete
          </button>
        ) : (
          <span className="text-xs text-slate-500">Insufficient permissions</span>
        )}
      </td>
    </tr>
  );
}
