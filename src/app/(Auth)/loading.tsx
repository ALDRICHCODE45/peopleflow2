import { Spinner } from "@shadcn/spinner";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Spinner className="size-10 text-primary" />
    </div>
  );
}
