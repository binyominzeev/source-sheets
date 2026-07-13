import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSheet, stripHtml } from "@/lib/sefaria";
import { normalizeUsertag, resolveUsertagRedirect } from "@/lib/auth";
import { getImportedSheet } from "@/lib/storage";
import SheetPageView from "@/components/SheetPageView";

interface Props {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sheetId } = await params;
  try {
    const sheet = await getSheet(sheetId);
    return {
      title: `${stripHtml(sheet.title)} — Source Sheets`,
      description: sheet.summary ? stripHtml(sheet.summary) : undefined,
    };
  } catch {
    return { title: "Sheet — Source Sheets" };
  }
}

export default async function SheetPage({ params, searchParams }: Props) {
  const { sheetId } = await params;
  const rawSearchParams = await searchParams;

  const langValue = rawSearchParams.lang;
  const fromValue = rawSearchParams.from;
  const langParam = typeof langValue === "string" ? langValue : undefined;
  const normalizedFromUsertag = typeof fromValue === "string" ? normalizeUsertag(fromValue) : undefined;
  const fromUsertag = normalizedFromUsertag
    ? resolveUsertagRedirect(normalizedFromUsertag).canonicalUsertag
    : undefined;

  // Keep legacy /sheets/:id?from=... URLs working while preferring canonical permalink URLs.
  if (fromUsertag) {
    const numericSheetId = Number(sheetId);
    if (Number.isFinite(numericSheetId)) {
      const imported = getImportedSheet(fromUsertag, numericSheetId);
      if (imported?.slug) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(rawSearchParams)) {
          if (key === "from") continue;
          if (typeof value === "string") {
            query.set(key, value);
            continue;
          }
          if (Array.isArray(value)) {
            for (const item of value) {
              query.append(key, item);
            }
          }
        }

        const queryString = query.toString();
        redirect(`/${fromUsertag}/${imported.slug}${queryString ? `?${queryString}` : ""}`);
      }
    }
  }

  return <SheetPageView sheetId={sheetId} fromUsertag={fromUsertag} langParam={langParam} />;
}
