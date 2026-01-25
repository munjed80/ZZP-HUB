"use client";

import { useState } from "react";
import { Send, Loader2, FileText, Calculator, HelpCircle, AlertTriangle, Receipt, Users } from "lucide-react";
import { z } from "zod";
import React from "react";
import { ExpensePreviewCard } from "./components/ExpensePreviewCard";
import { ClientPreviewCard } from "./components/ClientPreviewCard";
import { DebugPanel, DebugToggle, type DebugInfo } from "./components/DebugPanel";
import { SuccessBanner } from "./components/SuccessBanner";

// Shared line item schema for invoices and quotations
const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  price: z.number(),
  amount: z.number(),
  unit: z.string(),
  vatRate: z.string(),
});

// Zod schemas for API response data
const InvoicePreviewSchema = z.object({
  id: z.string(),
  invoiceNum: z.string(),
  clientName: z.string(),
  date: z.string(),
  dueDate: z.string(),
  total: z.number(),
  vatAmount: z.number(),
  totalWithVat: z.number(),
  lines: z.array(LineItemSchema).optional(),
});

const QuotationPreviewSchema = z.object({
  id: z.string(),
  quoteNum: z.string(),
  clientName: z.string(),
  date: z.string(),
  validUntil: z.string(),
  total: z.number(),
  vatAmount: z.number(),
  totalWithVat: z.number(),
  lines: z.array(LineItemSchema).optional(),
});

const InvoiceListItemSchema = z.object({
  id: z.string(),
  invoiceNum: z.string(),
  clientName: z.string(),
  total: z.number(),
  date: z.string(),
});

const VatSummarySchema = z.object({
  charged: z.number(),
  deductible: z.number(),
  netToPay: z.number(),
});

const RevenueSummarySchema = z.object({
  total: z.number(),
});

// Type-safe data payloads inferred from Zod schemas
type InvoiceListItem = z.infer<typeof InvoiceListItemSchema>;

// Type guard for checking if a value is a record
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: unknown;
  type?: string;
  needsConfirmation?: boolean;
  requestId?: string;
  intent?: string;
  missingFields?: string[];
}

// Error card component for displaying parse errors
function DataParseErrorCard({ title }: { title: string }): React.ReactElement {
  return (
    <div className="mt-3 rounded border border-destructive/50 bg-destructive/10 p-3">
      <div className="flex items-center gap-2 text-xs text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>{title}: Ongeldige data ontvangen</span>
      </div>
    </div>
  );
}

// Invoice Preview Card with Zod validation
function InvoicePreviewCard({ 
  message, 
  onConfirm 
}: { 
  message: Message; 
  onConfirm: (id: string) => void;
}): React.ReactElement | null {
  if (message.type !== "create_invoice" || !message.data) return null;
  
  if (!isRecord(message.data) || !("invoice" in message.data)) return null;
  
  const parseResult = InvoicePreviewSchema.safeParse(message.data.invoice);
  
  if (!parseResult.success) {
    return <DataParseErrorCard title="Factuur Preview" />;
  }
  
  const invoice = parseResult.data;
  
  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="text-sm font-semibold mb-2">Factuur Preview</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nummer:</span>
          <span className="font-medium">{invoice.invoiceNum}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Client:</span>
          <span className="font-medium">{invoice.clientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Datum:</span>
          <span className="font-medium">
            {new Date(invoice.date).toLocaleDateString("nl-NL")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Vervaldatum:</span>
          <span className="font-medium">
            {new Date(invoice.dueDate).toLocaleDateString("nl-NL")}
          </span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotaal:</span>
            <span>€{invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>BTW:</span>
            <span>€{invoice.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold mt-1">
            <span>Totaal:</span>
            <span className="text-primary">€{invoice.totalWithVat.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {message.needsConfirmation && (
        <button
          onClick={() => onConfirm(message.id)}
          className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Bevestig & Opslaan
        </button>
      )}
    </div>
  );
}

// Quotation Preview Card with Zod validation
function QuotationPreviewCard({ 
  message, 
  onConfirm 
}: { 
  message: Message; 
  onConfirm: (id: string) => void;
}): React.ReactElement | null {
  if (message.type !== "create_offerte" || !message.data) return null;
  
  if (!isRecord(message.data) || !("quotation" in message.data)) return null;
  
  const parseResult = QuotationPreviewSchema.safeParse(message.data.quotation);
  
  if (!parseResult.success) {
    return <DataParseErrorCard title="Offerte Preview" />;
  }
  
  const quotation = parseResult.data;
  
  return (
    <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
      <div className="text-sm font-semibold mb-2">Offerte Preview</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nummer:</span>
          <span className="font-medium">{quotation.quoteNum}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Client:</span>
          <span className="font-medium">{quotation.clientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Datum:</span>
          <span className="font-medium">
            {new Date(quotation.date).toLocaleDateString("nl-NL")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Geldig tot:</span>
          <span className="font-medium">
            {new Date(quotation.validUntil).toLocaleDateString("nl-NL")}
          </span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotaal:</span>
            <span>€{quotation.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>BTW:</span>
            <span>€{quotation.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold mt-1">
            <span>Totaal:</span>
            <span className="text-blue-700 dark:text-blue-400">
              €{quotation.totalWithVat.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      {message.needsConfirmation && (
        <button
          onClick={() => onConfirm(message.id)}
          className="mt-3 w-full rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors"
        >
          Bevestig & Opslaan
        </button>
      )}
    </div>
  );
}

// Invoice List Card with Zod validation
function InvoiceListCard({ message }: { message: Message }): React.ReactElement | null {
  if (message.type !== "query_invoices" || !message.data) return null;
  
  if (!isRecord(message.data) || !("invoices" in message.data)) return null;
  
  const invoicesData = message.data.invoices;
  if (!Array.isArray(invoicesData)) return null;
  
  const validInvoices: InvoiceListItem[] = [];
  for (const inv of invoicesData.slice(0, 5)) {
    const parsed = InvoiceListItemSchema.safeParse(inv);
    if (parsed.success) {
      validInvoices.push(parsed.data);
    }
  }
  
  if (validInvoices.length === 0) return null;
  
  return (
    <div className="mt-3 space-y-2">
      {validInvoices.map((inv) => (
        <div key={inv.id} className="rounded border border-border bg-background p-2 text-xs">
          <div className="font-semibold">{inv.invoiceNum}</div>
          <div>{inv.clientName} - €{inv.total.toFixed(2)}</div>
          <div className="text-muted-foreground">{new Date(inv.date).toLocaleDateString("nl-NL")}</div>
        </div>
      ))}
    </div>
  );
}

// BTW Summary Card with Zod validation
function BTWSummaryCard({ message }: { message: Message }): React.ReactElement | null {
  if (message.type !== "compute_btw" || !message.data) return null;
  
  if (!isRecord(message.data) || !("vat" in message.data) || !("revenue" in message.data)) return null;
  
  const vatResult = VatSummarySchema.safeParse(message.data.vat);
  const revenueResult = RevenueSummarySchema.safeParse(message.data.revenue);
  
  if (!vatResult.success || !revenueResult.success) {
    return <DataParseErrorCard title="BTW Overzicht" />;
  }
  
  const vat = vatResult.data;
  const revenue = revenueResult.data;
  
  return (
    <div className="mt-3 rounded border border-border bg-background p-3 text-xs">
      <div className="font-semibold">BTW Overzicht</div>
      <div className="mt-2 space-y-1">
        <div>Omzet: €{revenue.total.toFixed(2)}</div>
        <div>BTW verschuldigd: €{vat.charged.toFixed(2)}</div>
        <div>Voorbelasting: €{vat.deductible.toFixed(2)}</div>
        <div className="font-semibold text-primary">
          Netto te betalen: €{vat.netToPay.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

export function AIAssistClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo! Ik ben je AI Assistent. Ik kan je helpen met vragen over ZZP HUB, facturen en offertes aanmaken, uitgaven registreren, relaties toevoegen, en BTW berekeningen. Wat kan ik voor je doen?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    message: string;
    entityType?: "invoice" | "offerte" | "expense" | "client";
    entityId?: string;
  } | null>(null);

  const quickActions = [
    { label: "Maak factuur", icon: FileText, prompt: "Maak een factuur" },
    { label: "Maak offerte", icon: FileText, prompt: "Maak een offerte" },
    { label: "Voeg uitgave toe", icon: Receipt, prompt: "Registreer een uitgave" },
    { label: "Nieuwe relatie", icon: Users, prompt: "Voeg een nieuwe klant toe" },
    { label: "BTW overzicht", icon: Calculator, prompt: "Hoeveel BTW ben ik verschuldigd deze maand?" },
    { label: "Help", icon: HelpCircle, prompt: "Hoe gebruik ik ZZP HUB?" },
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuccessBanner(null); // Clear any existing success banner

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error("Fout bij ophalen van antwoord");
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.message || result.data?.answer || "Sorry, ik kon geen antwoord genereren.",
        timestamp: new Date(),
        data: result.data,
        type: result.type,
        needsConfirmation: result.needsConfirmation,
        requestId: result.requestId,
        intent: result.intent,
        missingFields: result.missingFields,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update debug info if debug mode is on
      if (isDebugMode) {
        setDebugInfo({
          requestId: result.requestId,
          intent: result.intent,
          type: result.type,
          draft: result.data,
          missingFields: result.missingFields,
        });
      }

      // Show success banner if entity was created
      if (result.data?.success && !result.needsConfirmation) {
        const entityType = result.type?.replace("create_", "") as "invoice" | "offerte" | "expense" | "client";
        const entityId = result.data?.invoice?.id || result.data?.quotation?.id || result.data?.expense?.id || result.data?.client?.id;
        
        setSuccessBanner({
          message: result.message || "Item succesvol aangemaakt!",
          entityType,
          entityId,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, er is een fout opgetreden. Probeer het opnieuw.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.data) return;
    
    if (!isRecord(message.data)) return;
    
    const hasInvoiceId = isRecord(message.data.invoice) && typeof message.data.invoice.id === "string";
    const hasQuotationId = isRecord(message.data.quotation) && typeof message.data.quotation.id === "string";
    
    if (!hasInvoiceId && !hasQuotationId) return;

    // TODO: Implement confirmation logic via API
    alert("Bevestig functionaliteit wordt binnenkort toegevoegd!");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Assist</h1>
        <p className="text-sm text-muted-foreground">
          Stel vragen, maak facturen, offertes, uitgaven en relaties met natuurlijke taal
        </p>
      </div>

      {/* Debug Toggle */}
      <DebugToggle isDebugMode={isDebugMode} onToggle={() => setIsDebugMode(!isDebugMode)} />

      {/* Debug Panel */}
      <DebugPanel 
        debugInfo={debugInfo} 
        isOpen={isDebugMode} 
        onClose={() => setDebugInfo(null)} 
      />

      {/* Success Banner */}
      {successBanner && (
        <SuccessBanner
          message={successBanner.message}
          entityType={successBanner.entityType}
          entityId={successBanner.entityId}
          onDismiss={() => setSuccessBanner(null)}
          onOpen={() => {
            // Navigate to entity
            if (successBanner.entityType && successBanner.entityId) {
              const link = successBanner.entityType === "invoice" 
                ? `/facturen/${successBanner.entityId}`
                : successBanner.entityType === "offerte"
                ? `/offertes/${successBanner.entityId}`
                : successBanner.entityType === "expense"
                ? `/uitgaven`
                : `/relaties`;
              window.location.href = link;
            }
          }}
        />
      )}

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.prompt)}
            disabled={isLoading}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-accent disabled:opacity-50"
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="mb-4 space-y-4 rounded-lg border border-border bg-card p-4" style={{ minHeight: "400px", maxHeight: "600px", overflowY: "auto" }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>

              {/* Preview Cards */}
              <InvoicePreviewCard message={message} onConfirm={handleConfirm} />
              <QuotationPreviewCard message={message} onConfirm={handleConfirm} />
              <ExpensePreviewCard message={message} onConfirm={handleConfirm} />
              <ClientPreviewCard message={message} onConfirm={handleConfirm} />
              <InvoiceListCard message={message} />
              <BTWSummaryCard message={message} />

              <div className="mt-1 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Typ je vraag of opdracht..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
