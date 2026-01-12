import { Skeleton } from "@shadcn/skeleton";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="rounded-lg border shadow-sm w-full min-w-0 overflow-hidden">
      <div className="overflow-x-auto w-full min-w-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 table-scroll-container">
        <TableComponent className="w-full min-w-fit">
          <TableHeader>
            <TableRow className="border-b">
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index} className="h-12 px-2 sm:px-6">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="border-b">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex} className="px-2 sm:px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </TableComponent>
      </div>
    </div>
  );
}
