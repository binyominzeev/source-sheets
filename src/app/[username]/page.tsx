import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, getUserSheets, SheetSummary } from "@/lib/sefaria";
import { getImportedSheets } from "@/lib/storage";
import {
  getAuthUser,
  getSessionUsertag,
  normalizeUsertag,
  resolveUsertagRedirect,
  resolveSefariaSlug,
} from "@/lib/auth";
import SheetListControls from "@/components/SheetListControls";
import RefreshButton from "@/components/RefreshButton";
import ImportSheetsDialog from "@/components/ImportSheetsDialog";
import UserAuthPanel from "@/components/UserAuthPanel";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const usertag = normalizeUsertag(username);
  const sefariaSlug = resolveSefariaSlug(usertag);
  return {
    title: `${usertag} — Source Sheets`,
    description: `Source sheets by ${sefariaSlug}`,
  };
}

export default async function UserSheetsPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { category } = await searchParams;
  const normalizedUsertag = normalizeUsertag(username);
  const { canonicalUsertag, redirectedFrom } = resolveUsertagRedirect(normalizedUsertag);
  if (redirectedFrom) {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    redirect(`/${canonicalUsertag}${query}`);
  }

  const usertag = canonicalUsertag;
  const sefariaSlug = resolveSefariaSlug(usertag);
  const authUser = getAuthUser(usertag);
  const sessionUsertag = await getSessionUsertag();
  const isOwner = sessionUsertag === usertag;

  let sheets: SheetSummary[] = [];
  let profileName = usertag;
  let error: string | null = null;

  try {
    const profile = await getProfile(sefariaSlug);
    profileName = profile.full_name || username;
    sheets = await getUserSheets(profile.id);
    // Default sort: newest first
    sheets.sort(
      (a, b) =>
        new Date(b.updated || b.created).getTime() -
        new Date(a.updated || a.created).getTime()
    );
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load sheets";
  }

  const imported = getImportedSheets(usertag);
  const importedById = new Map(imported.map((s) => [s.id, s]));

  // Merge in any manually-imported sheets (server-side JSON store).
  // We only add sheets that aren't already in the public list to avoid duplicates,
  // but if a public sheet is also imported we still attach its optional permalink slug.
  const publicIds = new Set(sheets.map((s) => s.id));
  sheets = sheets.map((sheet) => {
    const importedVersion = importedById.get(sheet.id);
    if (!importedVersion?.slug) return sheet;
    return {
      ...sheet,
      permalinkSlug: importedVersion.slug,
    };
  });

  for (const imp of imported) {
    if (!publicIds.has(imp.id)) {
      sheets.push({
        id: imp.id,
        title: imp.title,
        tags: [],
        views: 0,
        created: imp.importedAt,
        updated: imp.importedAt,
        permalinkSlug: imp.slug,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Home
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">{profileName}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {profileName}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-gray-500 text-sm">
              Source sheets on{" "}
              <a
                href={`https://www.sefaria.org/profile/${sefariaSlug}?tab=sheets`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Sefaria
              </a>
            </p>
            <UserAuthPanel
              usertag={usertag}
              isClaimed={Boolean(authUser)}
              isOwner={isOwner}
              sefariaSlug={authUser?.sefariaSlug ?? sefariaSlug}
              sessionUsertag={sessionUsertag}
            />
            {isOwner && (
              <>
                <RefreshButton username={usertag} />
                <ImportSheetsDialog username={usertag} />
              </>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">Could not load sheets</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <p className="text-gray-500 text-sm mt-3">
              Make sure the username{" "}
              <code className="bg-gray-100 px-1 rounded">{usertag}</code> is a
              valid Sefaria profile slug.
            </p>
          </div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No sheets found</p>
          </div>
        ) : (
          <SheetListControls
            sheets={sheets}
            username={usertag}
            initialCategorySlug={category}
          />
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-300 no-print">
        Powered by{" "}
        <a
          href="https://www.sefaria.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Sefaria API
        </a>
      </footer>
    </div>
  );
}
