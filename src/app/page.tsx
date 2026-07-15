import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="text-sm font-medium text-blue-600">KOMIKSTREAM</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Baca manga tanpa ribet.</h1>
      <p className="max-w-xl text-gray-600 dark:text-gray-300">
        Temukan manga, simpan bookmark, dan lanjutkan chapter terakhir.
      </p>
      <div className="flex gap-3">
        <Link href="/manga" className="rounded bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
          Jelajahi manga
        </Link>
        <Link href="/search" className="rounded border px-5 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
          Cari manga
        </Link>
      </div>
    </main>
  );
}
