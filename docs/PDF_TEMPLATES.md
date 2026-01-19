# PDF Templates Documentation

## Overview
ZZP-HUB uses React-PDF for generating professional PDF documents for invoices and quotations (offertes).

## File Location
**Path:** `components/pdf/InvoicePDF.tsx`

## Exports

### Component
- **`InvoicePDF`** - Main PDF component that generates invoice and quotation PDFs

### Types
- **`InvoicePdfData`** - Complete invoice/offerte data structure
- **`InvoicePdfLine`** - Individual line item on invoice/offerte
- **`InvoicePdfCompany`** - Company profile information
- **`InvoicePdfClient`** - Client information

## Component Usage

```typescript
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

// For invoices
<InvoicePDF 
  invoice={invoiceData} 
  documentType="FACTUUR" 
/>

// For quotations/offertes
<InvoicePDF 
  invoice={offerteData} 
  documentType="OFFERTE" 
/>
```

### Props
- `invoice: InvoicePdfData` - The invoice or offerte data
- `documentType?: "FACTUUR" | "OFFERTE"` - Document type (defaults to "FACTUUR")

## Type Definitions

### InvoicePdfData
```typescript
{
  invoiceNum: string;          // Invoice/offerte number
  date: string;                // Invoice date (formatted)
  dueDate: string;             // Due date or valid until date (formatted)
  client: InvoicePdfClient;    // Client information
  companyProfile: InvoicePdfCompany | null;  // Company information
  lines: InvoicePdfLine[];     // Line items
}
```

### InvoicePdfLine
```typescript
{
  description: string;         // Item description
  quantity: number;            // Quantity
  unit: string;                // Unit (e.g., "uur", "stuks")
  price: number;               // Unit price
  vatRate: "21" | "9" | "0";  // VAT percentage
}
```

### InvoicePdfCompany
```typescript
{
  companyName: string;         // Company name
  address: string;             // Street address
  postalCode: string;          // Postal code
  city: string;                // City
  kvkNumber?: string;          // KVK (Chamber of Commerce) number
  btwNumber?: string;          // BTW (VAT) number
  iban?: string;               // Bank account (IBAN)
  bankName?: string | null;    // Bank name (BIC)
  logoUrl?: string | null;     // Company logo URL (must be http/https)
  email?: string | null;       // Contact email
}
```

### InvoicePdfClient
```typescript
{
  name: string;                // Client name
  address: string;             // Street address
  postalCode: string;          // Postal code
  city: string;                // City
}
```

## Helper Functions

### calculateInvoiceTotals
Calculates totals for invoice/offerte lines.

```typescript
import { calculateInvoiceTotals } from "@/components/pdf/InvoicePDF";

const totals = calculateInvoiceTotals(lines);
// Returns: { subtotal, vatHigh, vatLow, total }
```

**Returns:**
```typescript
{
  subtotal: number;   // Total excluding VAT
  vatHigh: number;    // VAT at 21%
  vatLow: number;     // VAT at 9%
  total: number;      // Grand total including VAT
}
```

## PDF Layout

The PDF template includes:
1. **Header** - Document title (FACTUUR/OFFERTE) and invoice number
2. **Brand Card** - Company logo or initials badge with company name
3. **Parties Section** - Sender (company) and recipient (client) information
4. **Metadata** - Date and due date/valid until
5. **Line Items Table** - Itemized list with quantities, prices, VAT
6. **Totals** - Subtotal, VAT breakdown, and grand total
7. **Footer** - Bank details (IBAN, BIC), KVK, BTW, and email

## Styling Notes
- Uses Helvetica font family
- Primary color: `#111827` (gray-900)
- A4 page size
- Professional layout with cards, borders, and spacing
- Responsive flex layout for sections
- VAT calculations are automatic based on line item VAT rates

## Integration Points

### Invoice PDF Download
**File:** `components/pdf/InvoicePdfDownloadButton.tsx`
- Renders a download button
- Uses `InvoicePDF` component internally
- Generates PDF blob and triggers download

### Invoice Detail Pages
Used in:
- `app/(dashboard)/facturen/[id]/page.tsx` - Invoice detail page
- `app/(dashboard)/offertes/[id]/page.tsx` - Quotation detail page

### API Routes
- `app/api/invoices/[id]/pdf/route.ts` - Invoice PDF generation API
- Email attachments use the same component

## Security Considerations
- Company logo URLs are validated (must start with "http")
- All monetary values use `formatBedrag()` utility for consistent formatting
- Tenant isolation enforced through data layer (not PDF layer)

## Localization
- Labels are in Dutch (Netherlands)
- Currency formatted as EUR with euro symbol (€)
- Dates formatted using Dutch locale (dd-mm-yyyy)
