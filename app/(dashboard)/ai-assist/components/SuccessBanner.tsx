import React from "react";
import { Check, ExternalLink, X } from "lucide-react";

export interface SuccessBannerProps {
  message: string;
  entityType?: "invoice" | "offerte" | "expense" | "client";
  entityId?: string;
  onDismiss: () => void;
  onOpen?: () => void;
}

export function SuccessBanner({ 
  message, 
  entityType, 
  entityId,
  onDismiss,
  onOpen 
}: SuccessBannerProps): React.ReactElement {
  const getDeepLink = (): string | null => {
    if (!entityType || !entityId) return null;
    
    switch (entityType) {
      case "invoice":
        return `/facturen/${entityId}`;
      case "offerte":
        return `/offertes/${entityId}`;
      case "expense":
        return `/uitgaven`;
      case "client":
        return `/relaties`;
      default:
        return null;
    }
  };

  const deepLink = getDeepLink();

  return (
    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {message}
            </p>
            {deepLink && (
              <div className="mt-2">
                <a
                  href={deepLink}
                  onClick={(e) => {
                    if (onOpen) {
                      e.preventDefault();
                      onOpen();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open {entityType === "invoice" ? "factuur" : entityType === "offerte" ? "offerte" : entityType === "expense" ? "uitgaven" : "relaties"}
                </a>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-md p-1 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-green-600 dark:text-green-400" />
        </button>
      </div>
    </div>
  );
}
