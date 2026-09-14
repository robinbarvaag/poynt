import { getAdminUser } from "@/lib/events/admin-auth";
import { statusLabel } from "@/lib/events/capacity";
import { getRegistrationOverview } from "@/lib/events/registrations";
import { generateSlug } from "@/lib/generate-slug";
import { type NextRequest, NextResponse } from "next/server";

function cell(value: string | number | boolean | null | undefined): string {
  const text =
    typeof value === "boolean" ? (value ? "ja" : "nei") : String(value ?? "");
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const dateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("nb-NO", {
        timeZone: "Europe/Oslo",
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

/**
 * Deltakerliste som CSV — semikolon og BOM, så norsk Excel åpner den med
 * riktige kolonner og æøå.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser(request.headers))) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const { id } = await params;
  const overview = await getRegistrationOverview(Number(id));
  if (!overview) {
    return NextResponse.json({ error: "Fant ikke eventet." }, { status: 404 });
  }

  const { questions } = overview.event;
  const nameById = new Map(overview.rows.map((row) => [row.id, row.name]));
  const header = [
    "Navn",
    "E-post",
    "Følge av",
    "Status",
    "Betalt (kr)",
    "Kode",
    "Påmeldt",
    "Sjekket inn",
    "Meldt av",
    "Nyhetsbrev",
    ...questions.map((q) => q.label),
  ];
  const lines = overview.rows.map((row) =>
    [
      row.name,
      row.email,
      row.guestOfId ? nameById.get(row.guestOfId) : "",
      statusLabel(row.status),
      row.payment?.paidAt && !row.payment.refundedAt
        ? row.payment.amountKr
        : "",
      row.code,
      dateTime(row.createdAt),
      dateTime(row.checkedInAt),
      dateTime(row.cancelledAt),
      row.newsletter,
      ...questions.map((q) => row.answers[q.name]),
    ]
      .map(cell)
      .join(";")
  );

  const csv = `﻿${[header.map(cell).join(";"), ...lines].join("\r\n")}\r\n`;
  const filename = `pameldte-${generateSlug(overview.event.title) || overview.event.id}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
