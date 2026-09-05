import { Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode, Ref } from "react";

export default function BackLink({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  ref?: Ref<HTMLAnchorElement>;
  style?: CSSProperties;
  tabIndex?: number;
  to: "/" | "/blog";
}) {
  return (
    <Link className={`back-link ${className}`} {...rest}>
      <span aria-hidden="true" className="back-arrow">
        ←
      </span>
      {children}
    </Link>
  );
}
