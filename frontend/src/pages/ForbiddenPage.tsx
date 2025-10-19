export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-semibold">Permission denied</h1>
      <p className="max-w-md text-center text-sm text-slate-400">
        Your account does not have access to this resource. Please contact your administrator if you
        believe this is an error.
      </p>
      <a
        className="rounded border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800"
        href="/"
      >
        Go back home
      </a>
    </div>
  );
}
