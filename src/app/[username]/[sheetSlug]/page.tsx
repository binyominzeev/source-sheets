import { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { normalizeUsertag, resolveUsertagRedirect } from "@/lib/auth";
import { findImportedSheetBySlug } from "@/lib/storage";
import { getSheet, stripHtml } from "@/lib/sefaria";
import SheetPageView from "@/components/SheetPageView";

interface Props {
  params: Promise<{ username: string; sheetSlug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, sheetSlug } = await params;
  const usertag = normalizeUsertag(username);
  const imported = findImportedSheetBySlug(usertag, sheetSlug);
  if (!imported) {
    return { title: "Sheet — Source Sheets" };
  }

  try {
    const sheet = await getSheet(imported.id);
    return {
      title: `${stripHtml(sheet.title)} — Source Sheets`,
      description: sheet.summary ? stripHtml(sheet.summary) : undefined,
    };
  } catch {
    return { title: "Sheet — Source Sheets" };
  }
}

export default async function SheetPermalinkPage({ params, searchParams }: Props) {
  const { username, sheetSlug } = await params;
  const { lang: langParam } = await searchParams;
  const normalizedUsertag = normalizeUsertag(username);
  const { canonicalUsertag, redirectedFrom } = resolveUsertagRedirect(normalizedUsertag);
  if (redirectedFrom) {
    const query = langParam ? `?lang=${encodeURIComponent(langParam)}` : "";
    redirect(`/${canonicalUsertag}/${sheetSlug}${query}`);
  }

  const usertag = canonicalUsertag;
  const imported = findImportedSheetBySlug(usertag, sheetSlug);

  if (!imported) {
    notFound();
  }

  return (
    <SheetPageView
      sheetId={String(imported.id)}
      fromUsertag={usertag}
      langParam={langParam}
      permalinkPath={`/${usertag}/${imported.slug}`}
      languageBasePath={`/${usertag}/${imported.slug}`}
    />
  );
}
