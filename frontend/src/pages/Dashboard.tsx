import { useAuth } from '../providers/AuthProvider';

export function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-50">Welcome back, {user?.name}!</h1>
      <p className="mt-3 max-w-xl text-sm text-slate-400">
        Use the navigation to manage organizations, RFx, estimates, and proposals. Live metrics and
        activity feeds will appear here as the platform evolves.
      </p>
    </div>
  );
}
