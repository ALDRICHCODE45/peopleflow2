import { Spinner } from "@shadcn/spinner";

export default function SuperAdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Spinner className="size-10 text-white" />
    </div>
  );
}
