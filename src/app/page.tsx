import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4 text-blue-800">Source Sheets</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        A simplified Sefaria source sheet reader. Enter a Sefaria username in
        the URL to view their sheets.
      </p>
      <div className="bg-gray-100 rounded-lg p-4 text-left font-mono text-sm mb-8">
        <p className="text-gray-500 mb-1"># View a user&apos;s sheets:</p>
        <p>
          <Link
            href="/binyomin-szanto-varnagy"
            className="text-blue-600 hover:underline"
          >
            /binyomin-szanto-varnagy
          </Link>
        </p>
        <p className="text-gray-500 mt-3 mb-1"># View a specific sheet:</p>
        <p>
          <Link
            href="/sheets/713930"
            className="text-blue-600 hover:underline"
          >
            /sheets/713930
          </Link>
        </p>
      </div>
      <p className="text-sm text-gray-400">
        Powered by the{" "}
        <a
          href="https://www.sefaria.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Sefaria API
        </a>
        {" "}| Part of{" "}
        <a
          href="https://www.myshiurim.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          MyShiurim
        </a>
      </p>
    </main>
  );
}
