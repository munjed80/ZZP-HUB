import React from "react";
import { z } from "zod";
import { AlertTriangle, Check, ExternalLink, Mail } from "lucide-react";

// Type guard for checking if a value is a record
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Client Preview Schema
const ClientPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  kvkNumber: z.string().optional(),
  btwId: z.string().optional(),
});

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: unknown;
  type?: string;
  needsConfirmation?: boolean;
  requestId?: string;
}

interface ClientPreviewCardProps {
  message: Message;
  onConfirm?: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function ClientPreviewCard({ 
  message, 
  onConfirm,
  onOpen 
}: ClientPreviewCardProps): React.ReactElement | null {
  if (message.type !== "create_client" || !message.data) return null;
  
  if (!isRecord(message.data) || !("client" in message.data)) return null;
  
  const parseResult = ClientPreviewSchema.safeParse(message.data.client);
  
  if (!parseResult.success) {
    return (
      <div className="mt-3 rounded border border-destructive/50 bg-destructive/10 p-3">
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Relatie Preview: Ongeldige data ontvangen</span>
        </div>
      </div>
    );
  }
  
  const client = parseResult.data;
  
  return (
    <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Relatie/Klant Preview
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Naam:</span>
          <span className="font-medium">{client.name}</span>
        </div>
        
        {client.email && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">E-mail:</span>
            <span className="flex items-center gap-1 font-medium">
              <Mail className="h-3 w-3" />
              {client.email}
            </span>
          </div>
        )}
        
        {client.address && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adres:</span>
            <span className="font-medium">{client.address}</span>
          </div>
        )}
        
        {client.city && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stad:</span>
            <span className="font-medium">{client.city}</span>
          </div>
        )}
        
        {client.kvkNumber && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">KVK:</span>
            <span className="font-medium">{client.kvkNumber}</span>
          </div>
        )}
        
        {client.btwId && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">BTW-ID:</span>
            <span className="font-medium">{client.btwId}</span>
          </div>
        )}
      </div>
      
      {(message.needsConfirmation || onOpen) && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {message.needsConfirmation && onConfirm && (
            <button
              onClick={() => onConfirm(message.id)}
              className="flex-1 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors"
            >
              Bevestigen
            </button>
          )}
          {onOpen && client.id && (
            <button
              onClick={() => onOpen(client.id)}
              className="flex items-center gap-1 rounded-md border border-border bg-background hover:bg-accent px-3 py-2 text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </button>
          )}
        </div>
      )}
    </div>
  );
}
