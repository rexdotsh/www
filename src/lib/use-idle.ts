import { useEffect, useState } from "react";

const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "scroll"];

export function useIdle(after: number) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), after);
    };
    const wake = () => {
      setIdle(false);
      arm();
    };
    for (const type of ACTIVITY) {
      window.addEventListener(type, wake, { passive: true });
    }
    document.addEventListener("visibilitychange", wake);
    arm();
    return () => {
      clearTimeout(timer);
      for (const type of ACTIVITY) {
        window.removeEventListener(type, wake);
      }
      document.removeEventListener("visibilitychange", wake);
    };
  }, [after]);

  return idle;
}
