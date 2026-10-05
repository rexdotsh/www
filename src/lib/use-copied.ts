import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

const COPIED_MS = 1600;

export function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    (text: string) =>
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          sfx("pop");
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), COPIED_MS);
          return true;
        },
        () => false
      ),
    []
  );

  return [copied, copy] as const;
}
