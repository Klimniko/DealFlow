import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../api/organizations';
import { listRfx } from '../../api/rfx';
import { format } from 'date-fns';

export function OrganizationDetail() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const id = Number(organizationId);

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => getOrganization(id),
    enabled: Number.isFinite(id),
  });

  const { data: rfxData } = useQuery({
    queryKey: ['rfx', { organizationId: id }],
    queryFn: () => listRfx({ org_id: id, page: 1, limit: 50 }),
    enabled: Number.isFinite(id),
  });

  if (!Number.isFinite(id)) {
    return <div className="p-6 text-slate-300">Invalid organization ID.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-slate-300">Loading organization…</div>;
  }

  if (!organization) {
    return <div className="p-6 text-slate-300">Organization not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-50">{organization.name}</h1>
        <p className="text-sm text-slate-400">{organization.type.toUpperCase()}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoRow label="Website" value={organization.website ?? '—'} />
        <InfoRow label="Timezone" value={organization.timezone ?? '—'} />
        <InfoRow label="Country" value={organization.country_code ?? '—'} />
        <InfoRow
          label="Created"
          value={format(new Date(organization.created_at), 'dd MMM yyyy HH:mm')}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">RFx History</h2>
        <div className="mt-3 overflow-hidden rounded border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {rfxData?.data?.length ? (
                rfxData.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3">
                      <Link className="text-sky-400 hover:underline" to={`/rfx/${item.id}`}>
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{item.status}</td>
                    <td className="px-4 py-3">
                      {item.due_at ? format(new Date(item.due_at), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No RFx records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}
