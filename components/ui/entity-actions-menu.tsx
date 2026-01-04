"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { Popover } from "./popover";
import { Sheet } from "./sheet";

type EntityActionsMenuProps = {
  children: React.ReactNode;
  label?: string;
  title?: string;
  description?: string;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EntityActionsMenu({
  children,
  label = "Acties",
  title,
  description,
  triggerClassName,
  open,
  onOpenChange,
}: EntityActionsMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const resolvedOpen = useMemo(() => (open === undefined ? internalOpen : open), [internalOpen, open]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const debounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 120);
    };

    checkMobile();
    window.addEventListener("resize", debounced);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debounced);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (open === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const trigger = (
    <button
      type="button"
      onClick={() => handleOpenChange(!resolvedOpen)}
      className={buttonVariants("secondary", cn("px-3 py-2 gap-2", triggerClassName))}
      aria-haspopup="menu"
      aria-expanded={resolvedOpen}
    >
      <MoreVertical className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={resolvedOpen} onOpenChange={handleOpenChange} title={title ?? label} description={description}>
          <div className="space-y-3">{children}</div>
        </Sheet>
      </>
    );
  }

  return (
    <Popover
      trigger={trigger}
      align="end"
      side="bottom"
      collisionPadding={16}
      open={resolvedOpen}
      onOpenChange={handleOpenChange}
    >
      <div className="w-72 space-y-3">{children}</div>
    </Popover>
  );
}
