# AI Assist Implementation

## Overview
AI Assist is an intelligent assistant that helps users with ZZP HUB by:
1. Answering questions about the product and features
2. Creating invoices and quotations from natural language
3. Querying user data (invoices, VAT summaries, etc.)

## Architecture

### Components

```
app/
  (dashboard)/
    ai-assist/
      page.tsx              # Chat UI component
  api/
    ai/
      chat/
        route.ts            # Main API endpoint

lib/
  ai/
    router/
      index.ts              # Intent detection & routing
      knowledge-loader.ts   # RAG document loader
    tools/
      invoice-tools.ts      # Invoice creation
      offerte-tools.ts      # Quotation creation
      client-tools.ts       # Client management
      query-tools.ts        # Data queries
    schemas/
      actions.ts            # Zod validation schemas
    audit.ts                # Audit logging

docs/
  ai/
    product.md              # Product knowledge base
    features.md             # Features documentation
    faq.md                  # FAQ
    vat.md                  # VAT/BTW guide
```

## Flow

### 1. User Input
User types a message in the AI Assist chat:
- "Create an invoice for Client X amount 750 with 21% VAT"
- "How much BTW do I owe this month?"
- "Show my unpaid invoices"

### 2. Intent Detection
Router analyzes the message and determines intent:
- **Question**: Retrieve from knowledge base
- **Action**: Execute tool function

### 3. Action Execution
Based on intent, appropriate tool is called:
- `toolCreateInvoiceDraft`: Creates invoice
- `toolComputeBTW`: Calculates VAT summary
- `toolListInvoices`: Queries invoices

### 4. Response
Results returned to user with:
- Success/error message
- Data preview (for actions)
- Citations (for questions)
- Confirmation buttons (for drafts)

## Features

### Question Answering (RAG)
- Loads documentation from `/docs/ai/*.md`
- Finds relevant sections based on keywords
- Returns answer with citations
- No external AI API needed (pattern matching)

### Invoice Creation
Natural language → Invoice draft:
```
Input: "Create invoice for Daily Koeriersdiensten 750 euros 21% VAT due in 14 days"

Output: Invoice draft with:
- Client: Daily Koeriersdiensten
- Amount: €750
- VAT: 21%
- Due date: +14 days from today
- Status: CONCEPT
```

### Quotation Creation
Similar to invoices but with:
- Valid until date (instead of due date)
- Status: CONCEPT by default
- Can be converted to invoice later

### Data Queries
- List invoices (with filters: status, date range, client)
- Calculate VAT summary (by period: month, quarter, year)
- Revenue and expense totals

## Security

### Tenant Isolation
Every request is scoped by `userId`:
```typescript
const { userId } = await requireTenantContext(); // From session
await toolCreateInvoiceDraft(action, { userId });
```

All database queries include `where: { userId }`.

See [AI_ASSIST_SECURITY.md](./AI_ASSIST_SECURITY.md) for details.

### Audit Logging
Every AI action is logged:
```typescript
await logAIAction({
  userId,
  actionType: "create_invoice",
  payloadHash: sha256(input),
  resultId: invoice.id,
  success: true,
});
```

## Usage Examples

### Creating an Invoice
**User**: "Maak een factuur voor TestClient bedrag 500 euro met 21% BTW, betaling binnen 30 dagen"

**AI**:
1. Detects intent: `create_invoice`
2. Extracts parameters:
   - clientName: "TestClient"
   - amount: 500
   - vatRate: "21"
   - dueInDays: 30
3. Validates with Zod schema
4. Calls `toolCreateInvoiceDraft`
5. Returns preview with confirmation button

### Querying Invoices
**User**: "Toon onbetaalde facturen deze maand"

**AI**:
1. Detects intent: `query_invoices`
2. Extracts filters:
   - status: "VERZONDEN" (unpaid)
   - fromDate: first of current month
   - toDate: today
3. Calls `toolListInvoices`
4. Returns list of matching invoices

### VAT Calculation
**User**: "Hoeveel BTW ben ik verschuldigd dit kwartaal?"

**AI**:
1. Detects intent: `compute_btw`
2. Extracts period: "quarter"
3. Calls `toolComputeBTW`
4. Returns:
   - Total revenue
   - VAT charged
   - VAT deductible
   - Net VAT to pay

## Extending AI Assist

### Adding a New Action

1. **Create Zod Schema**
```typescript
// lib/ai/schemas/actions.ts
export const newActionSchema = z.object({
  param1: z.string(),
  param2: z.number(),
});
```

2. **Create Tool Function**
```typescript
// lib/ai/tools/new-tool.ts
export async function toolNewAction(
  action: NewAction,
  context: ToolContext
) {
  const { userId } = context;
  // Implement logic with tenant scoping
  // Return { success, data, message }
}
```

3. **Add to Router**
```typescript
// lib/ai/router/index.ts
function detectIntent(message: string) {
  if (message.includes("keyword")) {
    return { intent: "action", actionType: "new_action" };
  }
}

async function handleNewAction(message, context) {
  // Extract params
  // Validate with schema
  // Call tool
  // Return result
}
```

4. **Update RouterResult Type**
```typescript
export interface RouterResult {
  type?: "answer" | "create_invoice" | "new_action";
  // ...
}
```

### Adding Knowledge Documents
1. Create markdown file in `/docs/ai/`
2. Use ## headings for sections
3. Knowledge loader will automatically index it

## Limitations

### Current Implementation
- **No LLM Integration**: Uses pattern matching, not GPT/Claude
- **Simple Intent Detection**: Keyword-based, not semantic
- **Limited NLU**: Can't handle complex multi-step requests
- **No Memory**: Each message is independent

### Future Enhancements
- Integrate LLM for better understanding
- Multi-turn conversations with context
- More sophisticated parameter extraction
- Support for complex queries
- Client creation from chat
- Email sending from confirmation

## Testing

### Unit Tests
```bash
npm test tests/ai-schemas.test.mjs
```

### Manual Testing
1. Login to ZZP HUB
2. Navigate to AI Assist page
3. Test quick actions
4. Test natural language inputs
5. Verify results in database

### Integration Testing
See `docs/AI_ASSIST_SECURITY.md` for tenant isolation tests.

## Performance

### Optimization
- Knowledge documents are cached in memory
- Database queries use indexes (userId)
- Minimal processing per request

### Scaling
- Stateless design (no shared state)
- Can scale horizontally
- Consider rate limiting for production

## Monitoring

### Metrics to Track
- API response times
- Success/failure rates by action type
- Most common intents
- Failed authentication attempts

### Audit Log Analysis
```sql
-- Most used actions
SELECT actionType, COUNT(*) 
FROM AiActionAuditLog 
GROUP BY actionType 
ORDER BY COUNT(*) DESC;

-- Success rate
SELECT 
  actionType,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
FROM AiActionAuditLog
GROUP BY actionType;
```

## Troubleshooting

### "Not authenticated" error
- User session expired
- User not logged in
- Check NextAuth configuration

### "Client not found"
- Client name doesn't match exactly
- Implement fuzzy search or client creation flow

### "Validation error"
- Check Zod schema requirements
- Verify extracted parameters match schema

### No response from AI
- Check server logs
- Verify knowledge documents loaded
- Test with simple question first

## References
- [Tenant Isolation](./AI_ASSIST_SECURITY.md)
- [Prisma Schema](../prisma/schema.prisma)
- [API Routes](../app/api/ai/chat/route.ts)
