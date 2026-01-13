# Features Guide

## Invoices (Facturen)
Create, manage, and send professional invoices to your clients.

### Creating an Invoice
1. Navigate to "Facturen" in the sidebar
2. Click "Nieuwe factuur" (New invoice)
3. Select a client (relatie)
4. Add invoice lines with:
   - Description
   - Quantity
   - Unit (hour, piece, project, km, license, stop)
   - Price per unit
   - VAT rate (21%, 9%, or 0%)
5. Set invoice date and due date
6. Save as draft or send immediately

### Invoice Status
- **CONCEPT**: Draft, not yet sent
- **VERZONDEN**: Sent to client
- **BETAALD**: Marked as paid
- **HERINNERING**: Reminder sent

### Actions
- Send via email (requires email configuration)
- Download as PDF
- Mark as paid/unpaid
- Edit (only for drafts)
- Delete (only for drafts)

## Quotations (Offertes)
Create quotations that can be converted to invoices upon acceptance.

### Creating a Quotation
Similar to invoices, but with:
- Valid until date (instead of due date)
- Status: CONCEPT, VERZONDEN, GEACCEPTEERD, AFGEWEZEN, OMGEZET

### Converting to Invoice
Accepted quotations can be converted to invoices with one click, preserving all line items.

## VAT Overview (BTW-aangifte)
View your VAT obligations for any period.

### What's Included
- Total revenue (omzet) with VAT breakdown
- Expenses with deductible VAT (voorbelasting)
- Net VAT to pay or reclaim
- Quarterly and monthly views

### VAT Rates
- **21%**: Standard rate (HOOG_21)
- **9%**: Reduced rate (LAAG_9)
- **0%**: Zero-rated (NUL_0)
- **Vrijgesteld**: Exempt
- **Verlegd**: Reverse charge

## Time Tracking (Urenregistratie)
Track hours worked for the 1225-hour criterion.

### Adding Hours
- Manual entry: date, description, hours
- Dashboard shows progress toward 1225 hours
- Filter by period

### 1225-Hour Criterion
Dutch freelancers must work at least 1225 hours per year on their business to maintain certain tax benefits. The app helps you track progress.

## Clients (Relaties)
Manage your client database.

### Client Information
- Company name
- Address (street, postal code, city)
- Email address
- KVK number (optional)
- VAT ID/BTW ID (optional)

### Usage
- Select clients when creating invoices/quotations
- View all invoices/quotations per client
- Edit or delete clients (if not used in any documents)

## Expenses (Uitgaven)
Track business expenses with VAT for accurate reporting.

### Recording Expenses
- Category (select or create)
- Description
- Amount (excl. VAT)
- VAT rate
- Date
- Optional receipt upload

## Dashboard
Central overview of your business metrics.

### Metrics Displayed
- Total revenue (current month/year)
- Total expenses
- Profit/loss
- VAT summary
- Hours worked
- Recent invoices and quotations
- Upcoming due dates

## Settings (Instellingen)
Configure your company profile and preferences.

### Company Profile (Bedrijfsprofiel)
Required for generating invoices:
- Company name
- Address
- KVK number
- VAT number (BTW-nummer)
- IBAN
- Bank name
- Payment terms
- Logo upload (optional)
- Email sender name (optional)
- Reply-to email (optional)

### Small Business Scheme (KOR)
Toggle if you use "Kleineondernemersregeling" (affects VAT calculations)

## Email Integration
Send invoices and quotations directly via email.

### Configuration
Set up in Settings → Email configuration
- Uses Resend for delivery
- Requires verified sender domain or email
- Customizable sender name and reply-to address

### What Gets Sent
- Professional email with your branding
- PDF attachment of invoice/quotation
- Payment details (IBAN, payment terms)

## Mobile & Offline
Progressive Web App (PWA) with:
- Install on mobile devices
- Offline access to cached data
- Share/download PDFs on mobile using native share API
