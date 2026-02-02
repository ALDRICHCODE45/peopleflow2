import { Spinner } from "@shadcn/spinner";

export const LoadingModalState = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <Spinner className="size-10" />
    </div>
  );
};
