import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="flex h-full flex-col items-center justify-center font-mono">
        <p className="text-3xl text-rose-400/80">404</p>
        <p className="mt-4 text-lg text-primary">page not found</p>
        <Link
          className="mt-4 text-lg text-secondary transition-colors duration-200 hover:text-primary"
          href="/"
        >
          return home
        </Link>
      </div>
    </main>
  );
}
