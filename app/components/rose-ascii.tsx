import Image from "next/image";
import rose from "@/public/rose.avif";

export default function RoseAscii() {
  return (
    <div className="relative aspect-square w-full max-w-md overflow-hidden mix-blend-multiply dark:mix-blend-normal dark:opacity-80">
      <Image
        alt="Rose"
        className="object-contain"
        fill
        priority
        sizes="(min-width: 1024px) 400px, 100vw"
        src={rose}
      />
    </div>
  );
}
