export default function Footer() {
  return (
    <footer className="w-full font-mono text-xs text-gray-400 uppercase tracking-widest">
      <div className="flex flex-col gap-1">
        <span>© {new Date().getFullYear()} Rex.wf</span>
        <span>All Rights Reserved.</span>
        <span className="mt-2 text-[10px]">System: Ultracite v6.0</span>
      </div>
    </footer>
  );
}
