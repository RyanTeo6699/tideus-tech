"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { Json } from "@/lib/database.types";
import type { AppEventType } from "@/lib/app-events";

type EventLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  eventType: AppEventType;
  metadata?: Json;
  caseId?: string;
};

export function EventLink({ href, className, children, eventType, metadata, caseId }: EventLinkProps) {
  function handleClick() {
    void fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventType,
        caseId,
        path: window.location.pathname,
        metadata
      }),
      keepalive: true
    }).catch(() => {
      // Launch telemetry should never block navigation.
    });
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
