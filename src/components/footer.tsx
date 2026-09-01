export default function Footer() {
  return (
    <footer className="absolute bottom-0 w-full px-6 py-2 text-center text-secondary text-sm md:py-4 md:text-base">
      <div className="flex items-center justify-center space-x-3 transition-colors duration-300 hover:text-primary">
        <span>© {new Date().getFullYear()}</span>
        <span className="text-accent">•</span>
        <span>rex@unreal:~#</span>
      </div>
    </footer>
  );
}
