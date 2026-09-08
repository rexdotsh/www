import type { CSSProperties, ReactNode, Ref } from "react";

export default function BackLink({
  children,
  className = "",
  to,
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
    <a className={`back-link ${className}`} href={to} {...rest}>
      <span aria-hidden="true" className="back-arrow">
        ←
      </span>
      {children}
    </a>
  );
}
