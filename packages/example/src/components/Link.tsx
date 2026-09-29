"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigateTo } from "../navigation";

function shouldHandleClientNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

export function Link({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (!href || !shouldHandleClientNavigation(event)) {
          return;
        }

        event.preventDefault();
        void navigateTo(href);
      }}
    />
  );
}
