import { Spinner } from "@shadcn/spinner";
import { Dialog, DialogContent } from "@shadcn/dialog";

export const LoadingModalState = () => {
  return (
    <>
      <Dialog open={true}>
        <DialogContent className="w-lg flex justify-center items-center text-center">
          <Spinner className="size-10" />
        </DialogContent>
      </Dialog>
    </>
  );
};
