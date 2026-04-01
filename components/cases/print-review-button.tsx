"use client";

import { Button } from "@/components/ui/button";

export function PrintReviewButton() {
  return (
    <Button onClick={() => window.print()} type="button" variant="outline">
      Print or save PDF
    </Button>
  );
}
