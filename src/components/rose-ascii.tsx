import Navigation from "./navigation";

export default function RoseAscii({ hostname }: { hostname: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="rose-container relative animate-fade-in select-none">
        <img
          alt="Pink ASCII rose"
          className="absolute inset-0 h-full w-full select-none object-contain"
          fetchPriority="high"
          height="640"
          src="/rose.avif"
          width="640"
        />
      </div>
      <div className="animate-fade-in">
        <Navigation hostname={hostname} />
      </div>
    </div>
  );
}
