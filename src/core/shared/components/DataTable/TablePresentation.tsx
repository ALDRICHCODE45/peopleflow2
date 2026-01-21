interface Props {
  title: string;
  subtitle: string;
}

export const TablePresentation = ({ subtitle, title }: Props) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="mt-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </>
  );
};
