export default function Footer() {
  return (
    <footer className="mt-auto flex w-full items-center justify-between px-6 py-4 text-xs font-medium tracking-widest text-secondary uppercase md:px-12">
      <span>© {new Date().getFullYear()} REX</span>
      <span>EST. 2024</span>
    </footer>
  );
}
