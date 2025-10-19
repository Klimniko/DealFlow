import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { clsx } from 'clsx';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr] bg-slate-900 text-slate-100">
      <aside className="border-r border-slate-800 bg-slate-950/60">
        <div className="flex h-16 items-center gap-2 px-6 text-lg font-semibold">
          DealFlow
        </div>
        <nav className="flex flex-col gap-1 px-4">
          <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
            Dashboard
          </NavLink>
          <NavLink to="/organizations" className={({ isActive }) => navClass(isActive)}>
            Organizations
          </NavLink>
          <NavLink to="/rfx" className={({ isActive }) => navClass(isActive)}>
            RFx
          </NavLink>
        </nav>
      </aside>
      <main className="flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6">
          <div>
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>
        <section className="flex-1 overflow-y-auto bg-slate-900">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function navClass(isActive: boolean) {
  return clsx(
    'rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-50',
    isActive && 'bg-slate-800 text-slate-50',
  );
}
