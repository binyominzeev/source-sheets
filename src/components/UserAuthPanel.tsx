"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserAuthPanelProps {
  usertag: string;
  isClaimed: boolean;
  isOwner: boolean;
  sefariaSlug?: string;
  sessionUsertag?: string | null;
}

export default function UserAuthPanel({
  usertag,
  isClaimed,
  isOwner,
  sefariaSlug,
  sessionUsertag,
}: UserAuthPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [loginPassword, setLoginPassword] = useState("");
  const [claimSefariaSlug, setClaimSefariaSlug] = useState(sefariaSlug ?? usertag);
  const [claimProofCode, setClaimProofCode] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [changeFromUsertag, setChangeFromUsertag] = useState(sessionUsertag ?? "");
  const [changePassword, setChangePassword] = useState("");
  const [loading, setLoading] = useState<"claim" | "login" | "logout" | "changeTag" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function readJsonResponse<T>(res: Response): Promise<T | null> {
    const text = await res.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading("login");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usertag, password: loginPassword }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        setError(data?.error ?? `Login failed (${res.status})`);
        return;
      }
      setLoginPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading("claim");
    try {
      const res = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usertag,
          sefariaSlug: claimSefariaSlug,
          proofCode: claimProofCode,
          password: claimPassword,
        }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        setError(data?.error ?? `Claim failed (${res.status})`);
        return;
      }
      setClaimPassword("");
      setClaimProofCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  async function handleLogout() {
    setError(null);
    setMessage(null);
    setLoading("logout");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        setError(data?.error ?? `Logout failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  async function handleChangeTag(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading("changeTag");
    try {
      const res = await fetch("/api/auth/change-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUsertag: changeFromUsertag,
          newUsertag: usertag,
          password: changePassword,
        }),
      });
      const data = await readJsonResponse<{ error?: string; newUsertag?: string }>(res);
      if (!res.ok) {
        setError(data?.error ?? `Tag change failed (${res.status})`);
        return;
      }
      setChangePassword("");
      const nextUsertag = data?.newUsertag ?? usertag;
      setMessage(`User tag moved successfully. You are now signed in as ${nextUsertag}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-blue-500 hover:underline"
      >
        {isOwner ? "Account" : "Login"}
      </button>

      {open && (
        <div className="basis-full w-full border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm space-y-3 mt-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-amber-700 hover:underline"
            >
              Close
            </button>
          </div>

          {isOwner ? (
            <div className="border border-green-200 bg-green-50 rounded-lg px-3 py-2 text-sm flex items-center gap-3 flex-wrap">
              <p className="text-green-800">
                You are signed in as the owner of <strong>{usertag}</strong>.
              </p>
              <button
                onClick={handleLogout}
                disabled={loading === "logout"}
                className="px-2 py-1 rounded bg-white border border-green-300 text-green-700 hover:bg-green-100 text-xs"
              >
                {loading === "logout" ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : isClaimed ? (
            <form onSubmit={handleLogin} className="flex flex-wrap items-end gap-2">
              <div>
                <p className="text-amber-800 font-medium">Owner login required</p>
                <p className="text-amber-700 text-xs">Log in to import sheets and edit this page.</p>
              </div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="px-3 py-1.5 border border-amber-300 rounded bg-white"
                required
              />
              <button
                type="submit"
                disabled={loading === "login"}
                className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {loading === "login" ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <form onSubmit={handleClaim} className="space-y-2">
                <p className="text-amber-900 font-medium">Claim this user tag: {usertag}</p>
                <p className="text-amber-700 text-xs">
                  Add your proof code to your Sefaria bio first, then submit this form.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={claimSefariaSlug}
                    onChange={(e) => setClaimSefariaSlug(e.target.value)}
                    placeholder="Sefaria profile slug"
                    className="px-3 py-1.5 border border-amber-300 rounded bg-white"
                    required
                  />
                  <input
                    value={claimProofCode}
                    onChange={(e) => setClaimProofCode(e.target.value)}
                    placeholder="Proof code from bio"
                    className="px-3 py-1.5 border border-amber-300 rounded bg-white min-w-64"
                    required
                  />
                  <input
                    type="password"
                    value={claimPassword}
                    onChange={(e) => setClaimPassword(e.target.value)}
                    placeholder="Create password (min 8 chars)"
                    className="px-3 py-1.5 border border-amber-300 rounded bg-white"
                    minLength={8}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading === "claim"}
                    className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {loading === "claim" ? "Claiming..." : "Claim user tag"}
                  </button>
                </div>
              </form>

              <div className="border-t border-amber-200 pt-3">
                <form onSubmit={handleChangeTag} className="space-y-2">
                  <p className="text-amber-900 font-medium">Already claimed another tag?</p>
                  <p className="text-amber-700 text-xs">
                    Move your existing claimed account and imported sheet list to <strong>{usertag}</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={changeFromUsertag}
                      onChange={(e) => setChangeFromUsertag(e.target.value)}
                      placeholder="Current claimed user tag"
                      className="px-3 py-1.5 border border-amber-300 rounded bg-white"
                      required
                    />
                    <input
                      type="password"
                      value={changePassword}
                      onChange={(e) => setChangePassword(e.target.value)}
                      placeholder="Current password"
                      className="px-3 py-1.5 border border-amber-300 rounded bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading === "changeTag"}
                      className="px-3 py-1.5 rounded bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-60"
                    >
                      {loading === "changeTag" ? "Moving..." : "Move claim here"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {message && <p className="text-green-700 text-xs">{message}</p>}
          {error && <p className="text-red-700 text-xs">{error}</p>}
        </div>
      )}
    </>
  );
}
