import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="h-full flex justify-center flex-col items-center font-mono">
        <p className="text-3xl text-rose-400/80">404</p>
        <p className="text-primary mt-4 text-lg">page not found</p>
        <Link
          href="/"
          className="mt-4 text-secondary hover:text-primary transition-colors duration-200 text-lg"
        >
          return home
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
