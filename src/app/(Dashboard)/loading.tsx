import { Spinner } from "@shadcn/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <Spinner className="size-10 text-primary" />
    </div>
  );
}
