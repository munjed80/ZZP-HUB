# AI Assist - Complete Architecture Guide

## Overview

AI Assist is ZZP HUB's intelligent assistant that helps users create invoices, quotes, expenses, and clients using natural language in Dutch. It features multi-step data collection, preview/confirmation flows, and comprehensive audit logging.

## Architecture

### Core Components

```
lib/ai/
├── router/
│   ├── index.ts              # Main intent router & request handler
│   └── knowledge-loader.ts   # RAG-lite knowledge base search
├── tools/
│   ├── invoice-tools.ts      # Invoice creation logic
│   ├── offerte-tools.ts      # Quote creation logic
│   ├── expense-tools.ts      # Expense creation logic
│   ├── client-tools.ts       # Client management logic
│   └── query-tools.ts        # Data query tools (BTW, invoices)
├── schemas/
│   ├── actions.ts            # Action validation schemas
│   └── drafts.ts             # Draft & conversation schemas
├── parsers.ts                # Dutch language parsers
├── draft-state.ts            # Conversation state machine
└── audit.ts                  # Audit logging & observability

app/api/ai/
├── chat/route.ts             # Main chat endpoint
├── intent/route.ts           # Intent classification endpoint
├── draft/
│   ├── update/route.ts       # Update conversation draft
│   └── confirm/route.ts      # Confirm & execute draft

app/(dashboard)/ai-assist/
├── page.tsx                  # Main UI component
└── components/
    ├── ExpensePreviewCard.tsx
    ├── ClientPreviewCard.tsx
    ├── DebugPanel.tsx
    └── SuccessBanner.tsx
```

## Supported Intents

1. **help_question** - Product questions, how-to guides
2. **create_factuur** - Create invoices
3. **create_offerte** - Create quotes/quotations
4. **create_uitgave** - Create expenses
5. **create_client** - Create clients/relations
6. **query_invoices** - List/filter invoices
7. **query_expenses** - List/filter expenses
8. **compute_btw** - Calculate VAT summary
9. **update_settings** - Settings guidance (no actual changes via AI)
10. **unknown** - Unrecognized intent

## Request Flow

### 1. User Input
```
User: "Maak factuur voor Acme BV 320 stops @ 1.25 btw 21%"
```

### 2. Intent Detection
```typescript
// lib/ai/router/index.ts
const { intent, confidence } = detectIntent(message);
// Returns: { intent: "create_factuur", confidence: 0.9 }
```

### 3. Parameter Extraction
```typescript
const params = extractInvoiceParams(message);
// Returns: {
//   clientName: "Acme BV",
//   items: [{
//     description: "stops",
//     quantity: 320,
//     price: 1.25,
//     unit: "STUK",
//     vatRate: "21"
//   }]
// }
```

### 4. Validation
```typescript
const validated = createInvoiceActionSchema.parse(params);
// Zod validates required fields & types
```

### 5. Tool Execution
```typescript
const result = await toolCreateInvoiceDraft(validated, { userId });
// Returns: {
//   success: true,
//   invoice: { id, invoiceNum, clientName, total, ... },
//   message: "Draft invoice 2026-001 created..."
// }
```

### 6. Response
```typescript
return {
  intent: "create_factuur",
  requestId: "req_1234567890_abcdef12",
  type: "create_invoice",
  data: result,
  needsConfirmation: true,
  message: "Draft invoice created. Confirm to save?"
};
```

## Multi-Step Data Collection

When required fields are missing, AI Assist asks targeted questions:

```
User: "Maak factuur"
AI: "Voor welke klant is deze factuur?"

User: "Acme BV"
AI: "Welke diensten/producten wil je factureren?"

User: "320 stops @ 1.25"
AI: [Shows preview with confirm button]
```

### Draft State Machine

```typescript
// States: collecting → validating → previewing → confirmed
const draft = await getOrCreateDraft({
  conversationId: "conv_123",
  userId: "user_456",
  intent: "create_factuur"
});

// Update with new fields
await updateDraft({
  conversationId: "conv_123",
  userId: "user_456",
  draftUpdates: { clientName: "Acme BV" },
  status: "collecting"
});

// Complete when confirmed
await completeDraft({
  conversationId: "conv_123",
  userId: "user_456"
});
```

## Dutch Language Parsing

### Supported Patterns

**Invoice/Quote Items:**
```
"320 stops @ 1.25"           → 320x stops @ €1.25
"40 uur x 75 euro"           → 40x uur @ €75.00
"5 stuks koffie €2,50"       → 5x koffie @ €2.50
"Riza 320 stops price 1.25"  → For Riza: 320x stops @ €1.25
```

**Expenses:**
```
"Koffie 15 euro 9% btw"      → Category: Koffie, €15, 9% VAT
"Tankstation 50.25 vandaag"  → Category: Brandstof, €50.25, today
```

**Clients:**
```
"Acme BV, email@acme.nl, KVK 12345678"
"John Doe john@example.com Amsterdam"
```

### Parser Functions

```typescript
// Normalize decimals
normalizeDecimal("1,25")  // → 1.25
normalizeDecimal("1.25")  // → 1.25

// Normalize VAT rates
normalizeVatRate("21%")   // → "21"
normalizeVatRate("0.21")  // → "21"
normalizeVatRate("9")     // → "9"

// Parse dates
parseDate("vandaag")      // → "2026-01-14"
parseDate("14-01-2026")   // → "2026-01-14"
parseDate("gisteren")     // → "2026-01-13"

// Extract line items
parseLineItems("320 stops @ 1.25, 40 uur x 75")
// → [
//     { description: "stops", quantity: 320, price: 1.25, ... },
//     { description: "uur", quantity: 40, price: 75, ... }
//   ]
```

## Security & Tenant Isolation

### Multi-Tenant Correctness

Every database query is scoped by `userId` from session (never from client input):

```typescript
// ✅ CORRECT - userId from session
const { userId } = await requireTenantContext();
await prisma.invoice.findMany({
  where: { userId },  // Enforced tenant isolation
});

// ❌ WRONG - userId from client
const { userId } = await request.json();  // NEVER DO THIS
```

### Audit Logging

Every action is logged with full observability:

```typescript
await logAIAction({
  userId,
  actionType: "create_invoice",
  payload: { message },
  requestId: "req_1234567890_abcdef12",
  entityType: "invoice",
  entityId: "inv_789",
  status: "completed",
  success: true,
});
```

Step-level logging for debugging:

```typescript
logAIStep({ 
  requestId, 
  step: "intent_detected", 
  details: { intent: "create_factuur" } 
});
logAIStep({ 
  requestId, 
  step: "create_started", 
  details: { clientName: "Acme BV" } 
});
logAIStep({ 
  requestId, 
  step: "create_success", 
  details: { invoiceId: "inv_789" } 
});
```

## UI Components

### Preview Cards

Each entity type has a dedicated preview card:

```tsx
<InvoicePreviewCard message={message} onConfirm={handleConfirm} />
<QuotationPreviewCard message={message} onConfirm={handleConfirm} />
<ExpensePreviewCard message={message} onConfirm={handleConfirm} />
<ClientPreviewCard message={message} onConfirm={handleConfirm} />
```

### Debug Mode

Enable debug mode to see internal state:

```tsx
<DebugToggle isDebugMode={debugMode} onToggle={() => setDebugMode(!debugMode)} />
<DebugPanel 
  debugInfo={{
    requestId: "req_123",
    intent: "create_factuur",
    draft: { clientName: "Acme" },
    missingFields: ["items"]
  }}
  isOpen={debugMode}
  onClose={() => setDebugInfo(null)}
/>
```

### Success Banners

Show success with deep links:

```tsx
<SuccessBanner
  message="Factuur 2026-001 aangemaakt!"
  entityType="invoice"
  entityId="inv_789"
  onDismiss={() => setBanner(null)}
  onOpen={() => navigate(`/facturen/inv_789`)}
/>
```

## Adding New Actions

### 1. Define Zod Schema

```typescript
// lib/ai/schemas/actions.ts
export const createProjectActionSchema = z.object({
  name: z.string().min(1),
  budget: z.number().positive(),
  deadline: z.string().optional(),
});
export type CreateProjectAction = z.infer<typeof createProjectActionSchema>;
```

### 2. Create Tool Function

```typescript
// lib/ai/tools/project-tools.ts
export async function toolCreateProjectDraft(
  action: CreateProjectAction,
  context: ToolContext
) {
  const { userId } = context;
  
  const project = await prisma.project.create({
    data: {
      userId,
      name: action.name,
      budget: action.budget,
      deadline: action.deadline ? new Date(action.deadline) : undefined,
    },
  });
  
  return {
    success: true,
    project,
    message: `Project "${project.name}" created.`,
  };
}
```

### 3. Add Intent to Router

```typescript
// lib/ai/router/index.ts
function detectIntent(message: string) {
  // Add to patterns array
  { keywords: ["project", "maak project"], intent: "create_project", priority: 7 }
}

async function handleCreateProject(message: string, context: RouterContext) {
  const params = extractProjectParams(message);
  
  if (!params.name) {
    return {
      intent: "create_project",
      needsMoreInfo: true,
      missingFields: ["name"],
      message: "Wat is de projectnaam?",
    };
  }
  
  const validated = createProjectActionSchema.parse(params);
  const result = await toolCreateProjectDraft(validated, context);
  
  return {
    intent: "create_project",
    type: "create_project",
    data: result,
    needsConfirmation: true,
    message: result.message,
  };
}

// Add to router switch
case "create_project":
  return handleCreateProject(message, contextWithRequestId);
```

### 4. Create UI Preview Component

```typescript
// app/(dashboard)/ai-assist/components/ProjectPreviewCard.tsx
export function ProjectPreviewCard({ message, onConfirm }) {
  if (message.type !== "create_project") return null;
  
  const project = message.data?.project;
  if (!project) return null;
  
  return (
    <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="text-sm font-semibold">Project Preview</div>
      <div className="space-y-2 text-sm">
        <div>Naam: {project.name}</div>
        <div>Budget: €{project.budget.toFixed(2)}</div>
      </div>
      <button onClick={() => onConfirm(message.id)}>
        Bevestigen
      </button>
    </div>
  );
}
```

### 5. Integrate in Main Page

```typescript
// app/(dashboard)/ai-assist/page.tsx
import { ProjectPreviewCard } from "./components/ProjectPreviewCard";

// Add to quick actions
{ label: "Nieuw project", icon: Briefcase, prompt: "Maak een project" }

// Add to message rendering
<ProjectPreviewCard message={message} onConfirm={handleConfirm} />
```

## Debugging

### Enable Debug Mode

1. Click the bug icon in top-right corner
2. Debug panel shows:
   - Request ID
   - Detected intent
   - Current draft fields
   - Missing fields
   - Validation errors

### View Audit Logs

```sql
-- Recent AI actions
SELECT * FROM "AiActionAuditLog"
ORDER BY "createdAt" DESC
LIMIT 100;

-- Filter by user
SELECT * FROM "AiActionAuditLog"
WHERE "userId" = 'user_123'
ORDER BY "createdAt" DESC;

-- Filter by request ID
SELECT * FROM "AiActionAuditLog"
WHERE "requestId" = 'req_1234567890_abcdef12';

-- Success rate by action type
SELECT 
  "actionType",
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM "AiActionAuditLog"
GROUP BY "actionType"
ORDER BY total DESC;
```

### Console Logs

When `AI_DEBUG=true` in environment:

```
[AI_STEP] {
  timestamp: "2026-01-14T00:00:00.000Z",
  requestId: "req_1234567890_abcdef12",
  step: "intent_detected",
  intent: "create_factuur"
}
[AI_STEP] {
  step: "create_started",
  clientName: "Acme BV"
}
[AI_STEP] {
  step: "create_success",
  invoiceId: "inv_789"
}
```

## Testing

### Manual Testing Checklist

- [ ] Create invoice with full details
- [ ] Create invoice with missing fields (multi-step)
- [ ] Create quote with line items
- [ ] Create expense
- [ ] Create client
- [ ] Query invoices with filters
- [ ] Calculate BTW
- [ ] Ask help questions
- [ ] Test debug mode
- [ ] Test success banners
- [ ] Verify tenant isolation (different users can't see each other's data)

### Unit Test Examples

```typescript
// tests/ai-parsers.test.ts
import { normalizeDecimal, normalizeVatRate, parseLineItems } from "@/lib/ai/parsers";

describe("Dutch Language Parsers", () => {
  test("normalizes decimals", () => {
    expect(normalizeDecimal("1,25")).toBe(1.25);
    expect(normalizeDecimal("1.25")).toBe(1.25);
  });
  
  test("normalizes VAT rates", () => {
    expect(normalizeVatRate("21%")).toBe("21");
    expect(normalizeVatRate("0.21")).toBe("21");
  });
  
  test("parses line items", () => {
    const items = parseLineItems("320 stops @ 1.25");
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(320);
    expect(items[0].price).toBe(1.25);
  });
});
```

## Performance

### Caching

- Knowledge base documents are cached in memory
- No external API calls (all processing is local)
- Database queries use indexes on `userId`

### Optimization Tips

1. Keep knowledge base documents under 100KB total
2. Use `limit` parameter for list queries
3. Enable `AI_STORE_PAYLOAD=false` in production to reduce DB writes

## Troubleshooting

### "Client not found" Error

**Cause:** Client name doesn't match exactly or doesn't exist.

**Solution:** 
1. Use fuzzy matching (already implemented)
2. Or create client first: "Voeg klant toe: Acme BV, email@acme.nl"

### "Validation failed" Error

**Cause:** Missing required fields or invalid data.

**Solution:** Check `missingFields` in debug mode or ask AI to clarify.

### "Unauthorized" Error

**Cause:** User not logged in or session expired.

**Solution:** Refresh page and log in again.

### Entity Created but Not Visible

**Cause:** Potential tenant isolation bug.

**Solution:** 
1. Check audit logs for the userId
2. Verify entity has correct userId
3. Report to development team

## Security Considerations

1. **Never expose raw Prisma errors** - All errors are mapped to user-friendly messages
2. **Validate all inputs with Zod** - Strict type checking prevents injection
3. **Scope all queries by userId** - Enforced at tool level
4. **Log all actions** - Full audit trail for compliance
5. **No password changes via AI** - Settings guidance only

## Future Enhancements

- [ ] Multi-turn conversation memory (currently stateless per message)
- [ ] LLM integration for better understanding (currently pattern-based)
- [ ] Email sending from confirmation
- [ ] Bulk operations (create 10 invoices at once)
- [ ] Advanced analytics queries
- [ ] Voice input support
- [ ] Rate limiting per user
- [ ] Prompt injection detection
- [ ] PDF preview before confirmation

## References

- [Prisma Schema](../../prisma/schema.prisma)
- [API Routes](../../app/api/ai/)
- [UI Components](../../app/(dashboard)/ai-assist/)
- [Security Summary](../AI_ASSIST_SECURITY.md)
