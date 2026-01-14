import React from "react";
import { z } from "zod";
import { AlertTriangle, Check, ExternalLink } from "lucide-react";

// Type guard for checking if a value is a record
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Expense Preview Schema
const ExpensePreviewSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  amountExcl: z.number(),
  vatAmount: z.number(),
  totalAmount: z.number(),
  date: z.string(),
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

interface ExpensePreviewCardProps {
  message: Message;
  onConfirm?: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function ExpensePreviewCard({ 
  message, 
  onConfirm,
  onOpen 
}: ExpensePreviewCardProps): React.ReactElement | null {
  if (message.type !== "create_expense" || !message.data) return null;
  
  if (!isRecord(message.data) || !("expense" in message.data)) return null;
  
  const parseResult = ExpensePreviewSchema.safeParse(message.data.expense);
  
  if (!parseResult.success) {
    return (
      <div className="mt-3 rounded border border-destructive/50 bg-destructive/10 p-3">
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Uitgave Preview: Ongeldige data ontvangen</span>
        </div>
      </div>
    );
  }
  
  const expense = parseResult.data;
  
  return (
    <div className="mt-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        <div className="text-sm font-semibold text-green-900 dark:text-green-100">
          Uitgave Preview
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Categorie:</span>
          <span className="font-medium">{expense.category}</span>
        </div>
        
        {expense.description && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Beschrijving:</span>
            <span className="font-medium">{expense.description}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Datum:</span>
          <span className="font-medium">
            {new Date(expense.date).toLocaleDateString("nl-NL")}
          </span>
        </div>
        
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Excl. BTW:</span>
            <span>€{expense.amountExcl.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>BTW:</span>
            <span>€{expense.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold mt-1">
            <span>Totaal:</span>
            <span className="text-green-700 dark:text-green-400">
              €{expense.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {(message.needsConfirmation || onOpen) && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {message.needsConfirmation && onConfirm && (
            <button
              onClick={() => onConfirm(message.id)}
              className="flex-1 rounded-md bg-green-600 hover:bg-green-700 px-3 py-2 text-sm font-medium text-white transition-colors"
            >
              Bevestigen
            </button>
          )}
          {onOpen && expense.id && (
            <button
              onClick={() => onOpen(expense.id)}
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
