"use client";

import { workspaceRoleLabels } from "@poynt/planner-validators";
import {
  Badge,
  ListDetail,
  ListDetailDetail,
  ListDetailEmpty,
  ListDetailList,
  ListDetailListContent,
  ListDetailListHeader,
  ListDetailRow,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { CompanyDetail } from "./company-detail";

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role: "owner" | "admin" | "member" | "client";
};

export function CompaniesView({
  companies,
  activeWorkspaceId,
}: {
  companies: Company[];
  activeWorkspaceId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("valgt");

  const setSelected = React.useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("valgt", value);
      } else {
        params.delete("valgt");
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const selectedCompany = companies.find((c) => c.id === selected) ?? null;

  return (
    <div className="flex h-[calc(100svh-7rem)] min-h-[30rem] flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bedrifter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bytt mellom bedriftene dine, se medlemmer og administrer
          innstillinger.
        </p>
      </div>

      <ListDetail
        value={selected}
        onValueChange={setSelected}
        className="flex-1"
      >
        <ListDetailList>
          <ListDetailListHeader>
            <span className="flex-1 text-sm font-medium">Dine bedrifter</span>
            <Badge variant="muted" size="sm">
              {companies.length}
            </Badge>
          </ListDetailListHeader>
          <ListDetailListContent>
            {companies.map((company) => (
              <ListDetailRow key={company.id} value={company.id}>
                <span className="flex w-full items-center gap-2">
                  <span className="flex-1 truncate font-medium">
                    {company.name}
                  </span>
                  {company.id === activeWorkspaceId && (
                    <Badge variant="soft-primary" size="sm">
                      Aktiv
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {workspaceRoleLabels[company.role]}
                </span>
              </ListDetailRow>
            ))}
            {companies.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Du har ingen bedrifter enda.
              </p>
            )}
          </ListDetailListContent>
        </ListDetailList>

        <ListDetailDetail
          empty={
            <ListDetailEmpty>
              <Icon name="building-2" className="size-8 opacity-40" />
              <p className="text-sm">Velg en bedrift for å se detaljer.</p>
            </ListDetailEmpty>
          }
        >
          {selectedCompany && (
            <CompanyDetail
              company={selectedCompany}
              isActive={selectedCompany.id === activeWorkspaceId}
            />
          )}
        </ListDetailDetail>
      </ListDetail>
    </div>
  );
}
