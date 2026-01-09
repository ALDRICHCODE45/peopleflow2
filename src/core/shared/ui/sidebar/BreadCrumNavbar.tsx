"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@shadcn/breadcrumb";
import { usePathname } from "next/navigation";

export const BreadcrumbNavbar = () => {
  const pathname = usePathname();
  const pathNameToShow = pathname.split("/").at(1)?.toUpperCase();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="block">
          <BreadcrumbLink>BDP System</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{pathNameToShow}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
