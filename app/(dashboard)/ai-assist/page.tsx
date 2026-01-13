"use client";

import { useState } from "react";
import { Send, Loader2, FileText, Calculator, HelpCircle, AlertTriangle } from "lucide-react";
import { z } from "zod";
import React from "react";

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
// (Other types are inferred directly from Zod parsing)
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
  
  // Check if it's an object with an invoice property
  if (!isRecord(message.data) || !("invoice" in message.data)) return null;
  
  // Parse the invoice data with Zod for type safety
  const parseResult = InvoicePreviewSchema.safeParse(message.data.invoice);
  
  if (!parseResult.success) {
    return <DataParseErrorCard title="Factuur Preview" />;
  }
  
  const invoice = parseResult.data;
  
  return (
    <div className="mt-3 rounded border border-border bg-background p-3">
      <div className="text-xs font-semibold">Factuur Preview</div>
      <div className="mt-2 space-y-1 text-xs">
        <div>Nummer: {invoice.invoiceNum}</div>
        <div>Client: {invoice.clientName}</div>
        <div>Totaal: €{invoice.totalWithVat.toFixed(2)}</div>
      </div>
      {message.needsConfirmation && (
        <button
          onClick={() => onConfirm(message.id)}
          className="mt-2 rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
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
  
  // Check if it's an object with a quotation property
  if (!isRecord(message.data) || !("quotation" in message.data)) return null;
  
  // Parse the quotation data with Zod for type safety
  const parseResult = QuotationPreviewSchema.safeParse(message.data.quotation);
  
  if (!parseResult.success) {
    return <DataParseErrorCard title="Offerte Preview" />;
  }
  
  const quotation = parseResult.data;
  
  return (
    <div className="mt-3 rounded border border-border bg-background p-3">
      <div className="text-xs font-semibold">Offerte Preview</div>
      <div className="mt-2 space-y-1 text-xs">
        <div>Nummer: {quotation.quoteNum}</div>
        <div>Client: {quotation.clientName}</div>
        <div>Totaal: €{quotation.totalWithVat.toFixed(2)}</div>
      </div>
      {message.needsConfirmation && (
        <button
          onClick={() => onConfirm(message.id)}
          className="mt-2 rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
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
  
  // Parse each invoice in the array
  const invoicesData = message.data.invoices;
  if (!Array.isArray(invoicesData)) return null;
  
  // Parse and filter valid invoices
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

export default function AIAssistPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo! Ik ben je AI Assistent. Ik kan je helpen met vragen over ZZP HUB, facturen aanmaken, offertes maken, en BTW berekeningen. Wat kan ik voor je doen?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    { label: "Maak factuur", icon: FileText, prompt: "Maak een factuur" },
    { label: "Maak offerte", icon: FileText, prompt: "Maak een offerte" },
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
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
    
    // Use type guard to safely check data structure
    if (!isRecord(message.data)) return;
    
    // Check for invoice or quotation id using type-safe access
    const hasInvoiceId = isRecord(message.data.invoice) && typeof message.data.invoice.id === "string";
    const hasQuotationId = isRecord(message.data.quotation) && typeof message.data.quotation.id === "string";
    
    if (!hasInvoiceId && !hasQuotationId) return;

    // TODO: Implement confirmation logic
    alert("Bevestig functionaliteit wordt binnenkort toegevoegd!");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Assist</h1>
        <p className="text-sm text-muted-foreground">
          Stel vragen, maak facturen en offertes met natuurlijke taal
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
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

              {/* Invoice Preview */}
              <InvoicePreviewCard message={message} onConfirm={handleConfirm} />

              {/* Quotation Preview */}
              <QuotationPreviewCard message={message} onConfirm={handleConfirm} />

              {/* Invoice List */}
              <InvoiceListCard message={message} />

              {/* BTW Summary */}
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
