import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getRfx } from '../../api/rfx';

export function RfxDetail() {
  const { rfxId } = useParams<{ rfxId: string }>();
  const id = Number(rfxId);

  const { data, isLoading } = useQuery({
    queryKey: ['rfx', id],
    queryFn: () => getRfx(id),
    enabled: Number.isFinite(id),
  });

  if (!Number.isFinite(id)) {
    return <div className="p-6 text-slate-300">Invalid RFx identifier.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-slate-300">Loading RFx…</div>;
  }

  if (!data) {
    return <div className="p-6 text-slate-300">RFx not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="rounded bg-sky-600/20 px-2 py-1 text-xs font-semibold uppercase text-sky-300">
            {data.type}
          </span>
          <span className="rounded bg-slate-800 px-2 py-1 text-xs capitalize text-slate-200">
            {data.status}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-50">{data.title}</h1>
        {data.due_at ? (
          <p className="text-sm text-slate-400">
            Due {formatDistanceToNow(new Date(data.due_at), { addSuffix: true })}
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Info label="Organization ID" value={data.org_id.toString()} />
        <Info label="Owner" value={`User #${data.owner_user_id}`} />
        <Info label="Notes" value={data.notes ?? '—'} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Attachments</h2>
        <div className="mt-2 rounded border border-slate-800 bg-slate-950/40 p-4">
          {data.attachments_url?.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
              {data.attachments_url.map((item) => (
                <li key={item}>
                  <a className="text-sky-400 hover:underline" href={item}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No attachments uploaded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}
