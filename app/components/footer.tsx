export default function Footer() {
  return (
    <footer className="absolute bottom-0 w-full px-6 py-2 text-center text-amber-800/70 text-sm md:py-4 md:text-base dark:text-neutral-500">
      <div className="flex items-center justify-center space-x-3 transition-colors duration-300 hover:text-amber-600 dark:hover:text-neutral-300">
        <span>© {new Date().getFullYear()}</span>
        <span className="text-[var(--accent)]">•</span>
        <span>rex@unreal:~#</span>
      </div>
    </footer>
  );
}
