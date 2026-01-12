interface Props {
  title: string;
  subtitle: string;
}

export const TablePresentation = ({ subtitle, title }: Props) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
};
