import React from "react";
import { Bug, X } from "lucide-react";

export interface DebugInfo {
  requestId?: string;
  intent?: string;
  type?: string;
  draft?: Record<string, unknown>;
  missingFields?: string[];
  validationErrors?: string[];
}

interface DebugPanelProps {
  debugInfo: DebugInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ debugInfo, isOpen, onClose }: DebugPanelProps): React.ReactElement | null {
  if (!isOpen || !debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[500px] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold">Debug Mode</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent transition-colors"
          aria-label="Close debug panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {debugInfo.requestId && (
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Request ID:</div>
            <div className="font-mono bg-muted p-2 rounded break-all">
              {debugInfo.requestId}
            </div>
          </div>
        )}

        {debugInfo.intent && (
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Intent:</div>
            <div className="bg-muted p-2 rounded">
              {debugInfo.intent}
            </div>
          </div>
        )}

        {debugInfo.type && (
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Type:</div>
            <div className="bg-muted p-2 rounded">
              {debugInfo.type}
            </div>
          </div>
        )}

        {debugInfo.draft && Object.keys(debugInfo.draft).length > 0 && (
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Draft Fields:</div>
            <div className="bg-muted p-2 rounded font-mono overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(debugInfo.draft, null, 2)}</pre>
            </div>
          </div>
        )}

        {debugInfo.missingFields && debugInfo.missingFields.length > 0 && (
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Missing Fields:</div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded">
              <ul className="list-disc list-inside space-y-1">
                {debugInfo.missingFields.map((field, idx) => (
                  <li key={idx} className="text-orange-700 dark:text-orange-300">{field}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {debugInfo.validationErrors && debugInfo.validationErrors.length > 0 && (
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Validation Errors:</div>
            <div className="bg-destructive/10 p-2 rounded">
              <ul className="list-disc list-inside space-y-1">
                {debugInfo.validationErrors.map((error, idx) => (
                  <li key={idx} className="text-destructive text-xs">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DebugToggleProps {
  isDebugMode: boolean;
  onToggle: () => void;
}

export function DebugToggle({ isDebugMode, onToggle }: DebugToggleProps): React.ReactElement {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-20 right-4 z-40 rounded-full p-2 shadow-md transition-colors ${
        isDebugMode 
          ? "bg-orange-500 text-white hover:bg-orange-600" 
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
      aria-label="Toggle debug mode"
      title="Toggle debug mode"
    >
      <Bug className="h-4 w-4" />
    </button>
  );
}
