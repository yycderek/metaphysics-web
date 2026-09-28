import type { ReactNode } from "react";

export default function LiveNote({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <p role="status" aria-live="polite" className={className}>
      {children}
    </p>
  );
}
