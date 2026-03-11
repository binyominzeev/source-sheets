"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="ml-1 text-xs text-gray-400 hover:text-gray-700"
      aria-label="Print"
      title="Print"
    >
      🖨
    </button>
  );
}
