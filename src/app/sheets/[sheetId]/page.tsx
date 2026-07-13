import { Metadata } from "next";
import { getSheet, stripHtml } from "@/lib/sefaria";
import { normalizeUsertag } from "@/lib/auth";
import SheetPageView from "@/components/SheetPageView";

interface Props {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ lang?: string; from?: string }>;
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
  const { lang: langParam, from } = await searchParams;
  const fromUsertag = from ? normalizeUsertag(from) : undefined;

  return <SheetPageView sheetId={sheetId} fromUsertag={fromUsertag} langParam={langParam} />;
}
