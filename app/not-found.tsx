import Link from "next/link";

const NotFoundPage = () => {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="h-full flex justify-center flex-col items-center font-mono">
        <p className="text-3xl text-rose-400/80">404</p>
        <p className="text-[#d6e9ef] mt-4 text-lg">page not found</p>
        <Link href="/" className="mt-4 text-[#6e7681] hover:text-[#d6e9ef] transition-colors duration-200 text-lg">
          return home
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
