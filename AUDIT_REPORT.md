# ZZP-HUB Project Audit Report

**Date:** 2026-01-05  
**Auditor:** GitHub Copilot  
**Project:** ZZP-HUB Next.js SaaS Application

---

## 1) Quick Overview

### Tech Stack
- **Framework:** Next.js 16.1.1 (App Router, React 19.2.3)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS v4 + custom component library (shadcn-style)
- **Database:** PostgreSQL with Prisma ORM 6.1.0
- **Authentication:** NextAuth 4.24.13 with credentials provider (bcrypt password hashing)
- **Email Service:** Resend 6.6.0
- **PDF Generation:** @react-pdf/renderer 4.3.1
- **PWA:** @ducanh2912/next-pwa 10.2.9
- **Forms:** React Hook Form 7.53.0 + Zod 3.23.8
- **State/UI:** Sonner (toasts), Framer Motion, Lucide Icons, Recharts

### App Modules Detected
- **Dashboard** (`app/(dashboard)/dashboard/page.tsx`) - KPI cards, revenue/expenses charts, recent invoices/expenses
- **Facturen (Invoices)** (`app/(dashboard)/facturen/`) - Create, edit, list, PDF download, email sending, mark paid/unpaid
- **Offertes (Quotations)** (`app/(dashboard)/offertes/`) - Create, list, convert to invoice
- **Relaties (Clients)** (`app/(dashboard)/relaties/`) - Client CRUD operations
- **Uren (Time Tracking)** (`app/(dashboard)/uren/`) - Hours registration for 1225-hour criterion
- **Uitgaven (Expenses)** (`app/(dashboard)/uitgaven/`) - Expense tracking with VAT
- **BTW Aangifte (VAT Declaration)** (`app/(dashboard)/btw-aangifte/`) - Quarterly VAT overview
- **Agenda (Calendar)** (`app/(dashboard)/agenda/`) - Event scheduling
- **Instellingen (Settings)** (`app/(dashboard)/instellingen/`) - Company profile, security, email settings, backup
- **Support** (`app/(dashboard)/support/`) - Support form submission
- **Admin** (`app/(dashboard)/admin/companies/`) - SUPERADMIN company management

---

## 2) Feature Reality Check

### ✅ Invoice Creation/Edit/List/Print PDF
**Status:** ✅ **WORKS**

**Files:**
- `app/(dashboard)/facturen/page.tsx` - Invoice list with desktop/mobile views
- `app/(dashboard)/facturen/nieuw/page.tsx` - New invoice creation
- `app/(dashboard)/facturen/[id]/edit/page.tsx` - Edit existing invoice
- `app/(dashboard)/facturen/actions.ts` - Create/update invoice actions
- `app/(dashboard)/facturen/schema.ts` - Zod validation schema
- `components/pdf/InvoicePDF.tsx` - PDF generation
- `components/pdf/InvoicePdfDownloadButton.tsx` - PDF download component
- `lib/pdf-generator.ts` - PDF generation utilities

**Evidence:** Full CRUD implemented with React Hook Form, Zod validation, dynamic line items, VAT rates (21%, 9%, 0%), and PDF download functionality using @react-pdf/renderer.

---

### ⚠️ Invoice Email Sending (Resend Integration)
**Status:** ⚠️ **PARTIAL**

**Files:**
- `app/actions/send-invoice.tsx` - Email sending logic with Resend
- `components/emails/InvoiceEmail.tsx` - Email template
- `app/(dashboard)/facturen/[id]/send-invoice-email-button.tsx` - Send email UI component

**What Works:**
- Resend integration configured
- Email template with invoice PDF attachment
- Company logo support with allowed hosts whitelist
- Reply-to and sender name customization from company profile
- Status update to `VERZONDEN` after sending

**What's Missing/Issues:**
1. **No email send logs** - No database table to track email history (sent date, recipient, status, errors)
2. **Environment dependency** - Requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ALLOWED_LOGO_HOSTS` env vars
3. **No retry mechanism** - Failed emails not logged or retryable
4. **No email queue** - Synchronous sending could timeout on slow connections

**Runtime Risk:** If `RESEND_API_KEY` is missing, feature silently fails with error message. No graceful degradation.

---

### ⚠️ Invoice Statuses (Sent/Paid/Unpaid) and Ability to Revert "Paid"
**Status:** ⚠️ **PARTIAL** (Schema Issue)

**Files:**
- `prisma/schema.prisma` (lines 18-23) - `InvoiceEmailStatus` enum
- `app/actions/invoice-actions.ts` - Mark paid/unpaid actions
- `app/(dashboard)/facturen/_components/invoice-actions-menu.tsx` - UI for status changes

**What Works:**
- Mark invoice as paid: `markAsPaid()` sets `emailStatus` to `BETAALD`
- Revert to unpaid: `markAsUnpaid()` sets `emailStatus` to `VERZONDEN`
- UI shows badge variants (success/info/warning/muted)

**Critical Schema Issue:**
The `emailStatus` field mixes two separate concerns:
```prisma
enum InvoiceEmailStatus {
  CONCEPT      // Draft (not sent)
  VERZONDEN    // Email sent
  BETAALD      // PAID (payment status, not email status!)
  HERINNERING  // Reminder sent
}
```

**Problem:** 
- `BETAALD` is a **payment status**, not an email status
- Cannot track both email delivery AND payment separately
- What if invoice is sent but not paid? Or paid but never sent via email?
- Reverting from `BETAALD` goes to `VERZONDEN`, assuming it was emailed (may not be true)

**Recommended Fix:**
Split into two fields:
```prisma
emailStatus  EmailStatus    @default(NOT_SENT)  // NOT_SENT, SENT, REMINDER_SENT
paymentStatus PaymentStatus @default(UNPAID)    // UNPAID, PAID, OVERDUE
```

---

### ✅ Quotation Flow (Create, Send, Convert to Invoice)
**Status:** ✅ **WORKS**

**Files:**
- `app/(dashboard)/offertes/page.tsx` - List quotations
- `app/(dashboard)/offertes/nieuw/page.tsx` - Create quotation
- `app/(dashboard)/offertes/[id]/page.tsx` - View quotation
- `app/(dashboard)/offertes/[id]/convert-quotation-button.tsx` - Convert to invoice
- `app/(dashboard)/offertes/actions.ts` - Quotation CRUD and conversion logic
- `prisma/schema.prisma` (lines 127-141) - Quotation model with status tracking

**Evidence:** 
- Quotation creation with line items, VAT, units
- Status enum: `CONCEPT`, `VERZONDEN`, `GEACCEPTEERD`, `AFGEWEZEN`, `OMGEZET`
- Conversion to invoice implemented: copies quotation lines to new invoice
- After conversion, quotation status → `OMGEZET`

**Note:** Email sending for quotations not explicitly implemented (only invoices have email integration).

---

### ⚠️ Company Profile Settings (Including Logo Upload)
**Status:** ⚠️ **PARTIAL**

**Files:**
- `app/(dashboard)/instellingen/page.tsx` - Settings page
- `app/(dashboard)/instellingen/settings-tabs.tsx` - Tabs component (Profile, Security, Email, Backup)
- `app/(dashboard)/instellingen/settings-form.tsx` - Company profile form
- `app/(dashboard)/instellingen/actions.ts` - Save profile actions
- `prisma/schema.prisma` (lines 66-83) - CompanyProfile model with `logoUrl` field

**What Works:**
- Full company profile form: name, address, postal code, city, KVK, BTW number, IBAN, bank name, payment terms
- Logo upload: Base64 encoding + upload to server via `saveProfileAvatar()` action
- Real-time preview of uploaded logo
- LocalStorage caching for quick profile access
- Email settings: sender name, reply-to address
- Password change functionality
- Backup download (JSON export)
- Theme selection (light/dark/auto)
- KOR (kleine ondernemersregeling) toggle

**What's Missing:**
1. **Logo display locations unclear:**
   - Logo stored in `CompanyProfile.logoUrl`
   - Used in invoice email templates (`app/actions/send-invoice.tsx`)
   - NOT clearly displayed in dashboard header or sidebar (only company name shown)
   - Should display in: Dashboard header, PDF invoices, email footers

2. **Logo hosting:**
   - Code expects external URL (with `ALLOWED_LOGO_HOSTS` whitelist for security)
   - Upload endpoint saves Base64 but unclear where it's hosted after upload
   - No clear file storage integration (e.g., S3, Cloudinary, local public folder)

**File References:**
- Logo used in emails: `app/actions/send-invoice.tsx` (line 73-87) with trusted URL validation
- Logo preview in settings: `app/(dashboard)/instellingen/settings-tabs.tsx` (line 99)
- Logo NOT shown in: `app/(dashboard)/layout.tsx` (header shows company name only)

---

### ❌ Support (Form vs Real Ticket System)
**Status:** ❌ **MISSING** (Only Form, No Ticket System)

**Files:**
- `app/(dashboard)/support/page.tsx` - Support page UI
- `components/support/support-form.tsx` - Support form component
- `app/api/support/route.ts` - Support email submission endpoint

**What Exists:**
- Simple support form: name, email, subject, message, optional screenshot URL
- Form submits via API route to send email using Resend
- Email sent to `SUPPORT_EMAIL` env var (or `RESEND_FROM_EMAIL` fallback)
- No database persistence

**What's Missing:**
1. **No ticket system:** No `SupportTicket` model in Prisma schema
2. **No ticket history:** Users cannot view past support requests
3. **No status tracking:** No open/closed/resolved states
4. **No admin interface:** Admins cannot view/manage support tickets
5. **No responses:** No way to reply to user within the app (relies on email only)

**To Implement Real Support Tickets:**
```prisma
model SupportTicket {
  id          String   @id @default(uuid())
  userId      String
  subject     String
  message     String   @db.Text
  status      TicketStatus @default(OPEN)
  priority    TicketPriority @default(NORMAL)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User @relation(fields: [userId], references: [id])
  replies     TicketReply[]
}

model TicketReply {
  id        String   @id @default(uuid())
  ticketId  String
  userId    String?  // null for admin replies
  message   String   @db.Text
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_CUSTOMER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

### ⚠️ Onboarding First-Login Guide (LocalStorage vs DB)
**Status:** ⚠️ **PARTIAL** (LocalStorage Only)

**Files:**
- `components/onboarding/onboarding-tour.tsx` - Onboarding tour component
- `lib/constants.ts` (line 4) - `ONBOARDING_STORAGE_KEY = "zzp-hub-onboarding-v1"`
- `app/(dashboard)/layout.tsx` - Tour mounted in dashboard shell
- `components/layout/dashboard-client-shell.tsx` (line 11) - `<OnboardingTour userId={userId} />`

**What Works:**
- Interactive step-by-step tour with 3 steps:
  1. Fill company profile (links to settings)
  2. Add first client (links to relations)
  3. Create first invoice (highlights FAB + invoice button)
- Visual highlighting with spotlight effect
- Progress tracking (Step X / Y)
- Skip/Previous/Next navigation
- Completion stored in localStorage: `zzp-hub-onboarding-v1-{userId}`

**What's Missing:**
1. **Not stored in database** - If user clears browser data, tour reappears
2. **No cross-device sync** - Tour completion not synced if user logs in from different device
3. **No admin override** - Cannot force tour for specific users or reset tour
4. **No analytics** - Cannot track tour completion rates or drop-off points

**To Store in Database:**
Add to User model:
```prisma
model User {
  // ... existing fields
  onboardingCompletedAt DateTime?
  onboardingSkipped     Boolean @default(false)
  onboardingVersion     String? // Track tour version (e.g., "v1")
}
```

**Files to Update:**
- Update `components/onboarding/onboarding-tour.tsx` to read/write from DB instead of localStorage
- Add server action in `app/(dashboard)/actions.ts` to persist onboarding state

---

### ⚠️ PWA Setup (Manifest, Icons, Service Worker)
**Status:** ⚠️ **PARTIAL** (Configuration Present, Service Worker Missing)

**Files:**
- `next.config.ts` - PWA plugin configuration
- `public/manifest.json` - PWA manifest
- `public/manifest.webmanifest` - Duplicate manifest
- `public/pwa/` - PWA icons (icon-192.png, icon-512.png, maskable icons)
- `app/layout.tsx` - Manifest linked in metadata
- `components/providers/service-worker-register.tsx` - Service worker registration component
- `components/ui/install-pwa.tsx` - Install prompt component

**What Works:**
- **Manifest:** Properly configured with name, description, icons, theme colors, start_url, display mode
- **Icons:** Complete set of PWA icons including maskable variants for Android
- **Apple Touch Icon:** Present for iOS home screen
- **PWA Plugin:** `@ducanh2912/next-pwa` configured in `next.config.ts`
- **Service Worker Registration:** Component attempts to register `/sw.js`
- **Install Prompt:** UI component for "Add to Home Screen"

**What's Missing/Broken:**
1. **Service Worker File Not Found:**
   - Code expects `/sw.js` in public folder
   - File does not exist: `ls -la public/sw*` returns no results
   - PWA plugin should generate it during build, but it's disabled in development
   - **Critical:** No offline support without service worker

2. **Service Worker Config:**
   - `next.config.ts` (line 6): `disable: process.env.NODE_ENV === "development"`
   - Service worker only generated in production builds
   - `workboxOptions` configured for caching static assets and images

3. **Missing Features:**
   - No offline fallback page
   - No background sync for forms
   - No push notification setup (though infrastructure ready)

**To Verify in Production:**
1. Build: `npm run build`
2. Check for generated `public/sw.js` and `public/workbox-*.js`
3. Test offline mode in Chrome DevTools > Application > Service Workers

**Recommendation:** Add offline fallback route and test PWA in production build.

---

### ✅ SEO/OG Sharing Previews (Favicon, OG Image, metadataBase)
**Status:** ✅ **WORKS**

**Files:**
- `app/layout.tsx` - Root layout with comprehensive metadata
- `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png` - Favicon files
- `public/og-image.png` - OpenGraph preview image (1200x630)
- `public/apple-touch-icon.png` - iOS icon
- `app/robots.ts` - Robots.txt generation
- `app/sitemap.ts` - Sitemap generation
- `next.config.ts` (lines 43-91) - Cache headers for static assets

**Evidence:**
```tsx
// app/layout.tsx (lines 10-67)
export const metadata: Metadata = {
  metadataBase: new URL("https://zzp-hub.app"),
  title: {
    default: "ZZP-HUB | Financieel dashboard voor zzp'ers",
    template: "%s | ZZP-HUB",
  },
  description: "Professioneel, mobiel-first financieel dashboard...",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: "https://zzp-hub.app/",
    title: "ZZP-HUB | Financieel dashboard voor zzp'ers",
    description: "...",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
}
```

**All Required Assets Present:**
- ✅ Favicons (16x16, 32x32, ico)
- ✅ OG image (1200x630)
- ✅ Apple touch icon (180x180)
- ✅ PWA icons (192x192, 512x512 + maskable)
- ✅ Robots.txt at `/robots.ts`
- ✅ Sitemap at `/sitemap.ts`
- ✅ metadataBase configured
- ✅ Cache headers configured (1 hour max-age)

---

## 3) Database & Prisma

### Schema Summary

**Models:** 10 total
- `User` - Authentication, role (SUPERADMIN, COMPANY_ADMIN), suspension status
- `CompanyProfile` - Business details, logo, KVK, BTW, IBAN, email settings, KOR flag
- `Client` - Customer records with address, email, KVK, BTW ID
- `Invoice` - Invoice header with date, due date, emailStatus (PROBLEMATIC - see below)
- `InvoiceLine` - Invoice line items with quantity, price, amount, VAT rate, unit
- `Quotation` - Quotation header with date, validUntil, status
- `QuotationLine` - Quotation line items
- `Expense` - Expense tracking with category, amount, VAT, receipt URL
- `TimeEntry` - Hours registration with date, description, hours
- `Event` - Calendar events with start/end times

**Enums:**
- `BtwTarief` - HOOG_21, LAAG_9, NUL_0, VRIJGESTELD, VERLEGD
- `InvoiceEmailStatus` - CONCEPT, VERZONDEN, BETAALD, HERINNERING (⚠️ problematic)
- `QuotationStatus` - CONCEPT, VERZONDEN, GEACCEPTEERD, AFGEWEZEN, OMGEZET
- `Eenheid` - UUR, STUK, PROJECT, LICENTIE, SERVICE, KM, STOP
- `UserRole` - SUPERADMIN, COMPANY_ADMIN

### Route Mapping

| Route | Model(s) | Purpose |
|-------|----------|---------|
| `/dashboard` | Invoice, Expense, User | Stats, KPIs, recent items |
| `/facturen` | Invoice, InvoiceLine, Client, CompanyProfile | Invoice CRUD, PDF, email |
| `/offertes` | Quotation, QuotationLine, Client | Quotation CRUD, convert to invoice |
| `/relaties` | Client | Client CRUD |
| `/uren` | TimeEntry | Hours tracking |
| `/uitgaven` | Expense | Expense tracking |
| `/btw-aangifte` | Invoice, Expense | VAT calculation |
| `/agenda` | Event | Calendar |
| `/instellingen` | CompanyProfile, User | Settings |
| `/admin/companies` | User, CompanyProfile | SUPERADMIN only |

### Critical Schema Issues

#### 1. **`InvoiceEmailStatus` Enum Mixes Email + Payment Status** ⚠️

**Problem:**
```prisma
enum InvoiceEmailStatus {
  CONCEPT      // Email status: Not sent
  VERZONDEN    // Email status: Sent
  BETAALD      // Payment status: PAID (not email!)
  HERINNERING  // Email status: Reminder sent
}
```

**Impact:**
- Cannot track email delivery AND payment separately
- Invoice marked "BETAALD" loses email delivery status
- If invoice paid without being emailed, status is misleading
- Reverting from BETAALD goes to VERZONDEN (assumes it was emailed)

**Fix:**
```prisma
model Invoice {
  // ... existing fields
  emailStatus   EmailStatus    @default(NOT_SENT)
  paymentStatus PaymentStatus  @default(UNPAID)
  paidAt        DateTime?      // Track payment timestamp
  lastEmailSentAt DateTime?    // Track last email send
}

enum EmailStatus {
  NOT_SENT
  SENT
  REMINDER_SENT
  BOUNCE        // For future email bounce tracking
}

enum PaymentStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}
```

**Files to Update:**
- `prisma/schema.prisma` - Add new enums, split field
- `app/(dashboard)/facturen/page.tsx` - Update status badge logic
- `app/actions/invoice-actions.ts` - Update markAsPaid/markAsUnpaid to use new field
- `app/actions/send-invoice.tsx` - Update to set emailStatus only

---

#### 2. **Missing `SupportTicket` Model** ❌

**Current:** Support form sends email only, no persistence.

**Needed for Real Ticket System:**
```prisma
model SupportTicket {
  id          String   @id @default(uuid())
  userId      String
  ticketNum   String   @unique // e.g., "TICKET-2024-001"
  subject     String
  message     String   @db.Text
  status      TicketStatus @default(OPEN)
  priority    TicketPriority @default(NORMAL)
  category    String? // "Billing", "Technical", "Feature Request"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  closedAt    DateTime?
  user        User @relation(fields: [userId], references: [id])
  replies     TicketReply[]
}

model TicketReply {
  id        String   @id @default(uuid())
  ticketId  String
  userId    String?  // null if admin reply
  message   String   @db.Text
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  user      User?    @relation(fields: [userId], references: [id])
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_CUSTOMER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

**Also Update User Model:**
```prisma
model User {
  // ... existing fields
  supportTickets SupportTicket[]
  ticketReplies  TicketReply[]
}
```

---

#### 3. **Missing `EmailLog` Model** ⚠️

**Problem:** No audit trail of emails sent.

**Needed for:**
- Debugging delivery issues
- Tracking email open rates (future)
- Resending failed emails
- Compliance (proof of invoice delivery)

**Recommended:**
```prisma
model EmailLog {
  id          String   @id @default(uuid())
  userId      String
  entityType  String   // "invoice", "quotation", "support"
  entityId    String   // ID of invoice/quotation/ticket
  recipient   String   // Email address
  subject     String
  status      EmailLogStatus @default(PENDING)
  provider    String   @default("resend") // For multi-provider support
  providerId  String?  // Resend message ID
  error       String?  @db.Text
  sentAt      DateTime?
  createdAt   DateTime @default(now())
  user        User @relation(fields: [userId], references: [id])
}

enum EmailLogStatus {
  PENDING
  SENT
  DELIVERED
  BOUNCED
  FAILED
  OPENED     // For future tracking
  CLICKED    // For future tracking
}
```

**Also Update User Model:**
```prisma
model User {
  // ... existing fields
  emailLogs EmailLog[]
}
```

---

#### 4. **Missing Onboarding State in DB** ⚠️

**Current:** Onboarding completion stored in localStorage only.

**Add to User Model:**
```prisma
model User {
  // ... existing fields
  onboardingCompletedAt DateTime?
  onboardingSkipped     Boolean @default(false)
  onboardingVersion     String? @default("v1")
  onboardingStep        Int?    // Last completed step for resuming
}
```

---

### Migrations Needed

**For Upcoming Features:**

1. **Real Support Tickets:**
   - Add `SupportTicket` model
   - Add `TicketReply` model
   - Add `TicketStatus` enum
   - Add `TicketPriority` enum
   - Update `User` model relations

2. **Onboarding Stored Per User:**
   - Add `onboardingCompletedAt` to `User`
   - Add `onboardingSkipped` to `User`
   - Add `onboardingVersion` to `User`
   - Add `onboardingStep` to `User`

3. **Email Logs:**
   - Add `EmailLog` model
   - Add `EmailLogStatus` enum
   - Update `User` model relations

4. **Fix Invoice Status (Priority):**
   - Add `EmailStatus` enum
   - Add `PaymentStatus` enum
   - Add `emailStatus` field to `Invoice` (separate from payment)
   - Add `paymentStatus` field to `Invoice`
   - Add `paidAt` timestamp to `Invoice`
   - Add `lastEmailSentAt` to `Invoice`
   - Migrate existing `emailStatus` data
   - Remove old `InvoiceEmailStatus` enum

**Migration File Example:**
```prisma
// migrations/YYYYMMDDHHMMSS_split_invoice_status/migration.sql

-- Create new enums
CREATE TYPE "EmailStatus" AS ENUM ('NOT_SENT', 'SENT', 'REMINDER_SENT', 'BOUNCE');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- Add new columns
ALTER TABLE "Invoice" ADD COLUMN "emailStatusNew" "EmailStatus" NOT NULL DEFAULT 'NOT_SENT';
ALTER TABLE "Invoice" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Invoice" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "lastEmailSentAt" TIMESTAMP(3);

-- Migrate data
UPDATE "Invoice" SET "emailStatusNew" = 'NOT_SENT' WHERE "emailStatus" = 'CONCEPT';
UPDATE "Invoice" SET "emailStatusNew" = 'SENT' WHERE "emailStatus" = 'VERZONDEN';
UPDATE "Invoice" SET "emailStatusNew" = 'REMINDER_SENT' WHERE "emailStatus" = 'HERINNERING';
UPDATE "Invoice" SET "emailStatusNew" = 'SENT', "paymentStatus" = 'PAID', "paidAt" = NOW() WHERE "emailStatus" = 'BETAALD';

-- Drop old column and enum
ALTER TABLE "Invoice" DROP COLUMN "emailStatus";
ALTER TABLE "Invoice" RENAME COLUMN "emailStatusNew" TO "emailStatus";
DROP TYPE "InvoiceEmailStatus";
```

---

## 4) UI/UX & Mobile Audit

### Top 10 UX Issues (Prioritized)

#### 1. **Invoice List: Mobile Cards Missing Actions** ⚠️ (P0)
**File:** `app/(dashboard)/facturen/page.tsx` (lines 140-178)

**Issue:** 
- Desktop view: Actions menu visible and accessible (line 126-133)
- Mobile view: Actions menu rendered but hidden/hard to access (line 166-175)
- Mobile users struggle to mark invoices as paid or download PDFs

**Fix:** Ensure `InvoiceActionsMenu` is fully visible on mobile cards, possibly with prominent button.

---

#### 2. **Settings Tabs Not Shareable via URL** ⚠️ (P1)
**File:** `app/(dashboard)/instellingen/settings-tabs.tsx` (line 78-79)

**Issue:**
- Tabs use `useState` for active tab, read from `?tab=` URL param initially
- After initial load, URL not updated when switching tabs
- Cannot share direct link to "Email Settings" or "Security" tab

**Current:**
```tsx
const [activeTab, setActiveTab] = useState(initialTab);
```

**Fix:** Use Next.js `useRouter()` to update URL params on tab change:
```tsx
const router = useRouter();
const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  router.push(`/instellingen?tab=${tab}`, { scroll: false });
};
```

---

#### 3. **No Loading States on Forms** ⚠️ (P1)
**Files:**
- `app/(dashboard)/facturen/nieuw/invoice-form.tsx`
- `app/(dashboard)/instellingen/settings-form.tsx`

**Issue:**
- Forms use `useTransition()` for pending state but no visual feedback during submission
- User can't tell if form is processing or stuck
- Risk of double submissions

**Fix:** Add loading spinners and disable submit buttons during transitions.

---

#### 4. **Dashboard KPI Cards: Trend Labels Cut Off on Small Screens** ⚠️ (P1)
**File:** `app/(dashboard)/dashboard/page.tsx` (lines 126-128)

**Issue:**
```tsx
<Badge variant={item.trend.variant} className="...">
  {item.trend.label}  // e.g., "+15% vs vorige maand"
</Badge>
```
- Long trend labels like "+15% vs vorige maand" overflow on mobile
- Text truncates or wraps awkwardly

**Fix:** Shorten text on mobile:
```tsx
<Badge variant={item.trend.variant} className="...">
  <span className="hidden sm:inline">{item.trend.label}</span>
  <span className="sm:hidden">{item.trend.label.replace('vs vorige maand', '')}</span>
</Badge>
```

---

#### 5. **Onboarding Tour Blocks UI on Mobile** ⚠️ (P0)
**File:** `components/onboarding/onboarding-tour.tsx` (lines 106-119)

**Issue:**
- Tour overlay uses fixed positioning with spotlight effect
- On mobile, spotlight may be off-screen or obscured by tour card
- Tour card positioned at bottom, may cover highlighted element
- No "skip" button visible without scrolling

**Fix:**
- Adjust spotlight positioning logic for mobile viewports
- Move tour card to top on mobile when element is in lower half of screen
- Make "Skip" button sticky/always visible

---

#### 6. **Sidebar Navigation: No Active Route Highlighting** ⚠️ (P1)
**Files:**
- `components/layout/sidebar.tsx`
- `components/sidebar/*`

**Issue:**
- Sidebar links don't clearly indicate current page
- Users can't quickly see where they are in the app

**Fix:** Use `usePathname()` to add active state styling:
```tsx
const pathname = usePathname();
const isActive = pathname.startsWith(href);

<Link
  href={href}
  className={cn(
    "...",
    isActive && "bg-teal-50 text-teal-700 font-semibold"
  )}
>
```

---

#### 7. **No Empty States for Recent Items on Dashboard** ⚠️ (P2)
**File:** `app/(dashboard)/dashboard/page.tsx` (lines 192-252)

**Issue:**
- If user has no invoices or expenses yet, dashboard shows empty cards with no explanation
- No call-to-action to create first invoice/expense

**Fix:** Add conditional empty states:
```tsx
{stats.recentInvoices.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-slate-600">Nog geen facturen</p>
    <Link href="/facturen/nieuw" className={buttonVariants("primary", "mt-3")}>
      Maak je eerste factuur
    </Link>
  </div>
) : (
  // ... existing invoice list
)}
```

---

#### 8. **Invoice/Quotation Forms: Line Items Hard to Edit on Mobile** ⚠️ (P1)
**File:** `app/(dashboard)/facturen/nieuw/invoice-form.tsx`

**Issue:**
- Multi-column line item inputs cramped on mobile
- Difficult to tap small delete/add buttons
- No horizontal scroll, fields stack awkwardly

**Fix:** Implement responsive card layout for line items on mobile:
```tsx
<div className="md:grid md:grid-cols-6 gap-2 p-3 border rounded-lg space-y-2 md:space-y-0">
  {/* Desktop: grid, Mobile: stacked */}
</div>
```

---

#### 9. **Header User Menu Doesn't Show Avatar on Mobile** ⚠️ (P2)
**File:** `app/(dashboard)/layout.tsx` (lines 55-61)

**Issue:**
- Desktop: User name, plan, and avatar shown
- Mobile: Avatar only, name/plan hidden (lines 56-59)
- Inconsistent UX, user can't see their name on mobile

**Fix:** Show truncated name or initials on mobile:
```tsx
<div className="flex md:hidden flex-col text-right">
  <p className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">
    {userName.split(' ')[0]}
  </p>
</div>
```

---

#### 10. **No Confirmation Dialogs for Destructive Actions** ⚠️ (P0)
**File:** `app/(dashboard)/facturen/_components/invoice-actions-menu.tsx` (lines 60-73)

**Issue:**
- Delete invoice uses `window.confirm()` - not styled, inconsistent with app design
- No modern modal/dialog component

**Current:**
```tsx
const confirmed = window.confirm("Weet je zeker dat je deze factuur wilt verwijderen?");
```

**Fix:** Implement custom confirmation dialog component:
```tsx
<ConfirmDialog
  open={showDeleteDialog}
  title="Factuur verwijderen?"
  description="Deze actie kan niet ongedaan worden gemaakt."
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteDialog(false)}
/>
```

---

### Quick Wins vs Larger Redesign

**Quick Wins (1-2 hours each):**
1. Add active route highlighting to sidebar
2. Add loading states to forms (spinners + disabled buttons)
3. Fix invoice mobile card actions visibility
4. Add empty states to dashboard recent items
5. Update URL when switching settings tabs
6. Shorten trend labels on mobile KPI cards

**Larger Redesign (4+ hours each):**
1. Implement custom confirmation dialog component system
2. Redesign invoice/quotation line item editing for mobile
3. Fix onboarding tour mobile layout and positioning
4. Split invoice status into email + payment (schema + UI changes)
5. Build real support ticket system (backend + frontend)

---

## 5) Deployment / Coolify Risks

### Critical Deployment Issues

#### 1. **Missing Environment Variables Break Runtime** 🔴 (P0)

**Required Env Vars:**
```env
# Database (CRITICAL)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Auth (CRITICAL)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-strong-random-secret"

# Email (Feature breaks without it)
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="no-reply@your-domain.com"
SUPPORT_EMAIL="support@your-domain.com"

# Logo Security (Optional but recommended)
ALLOWED_LOGO_HOSTS="your-domain.com,cdn.your-domain.com"

# App URL (Used in emails)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
APP_URL="https://your-domain.com"  # Fallback
```

**Files Checking Env Vars:**
- `lib/prisma.ts` - Requires `DATABASE_URL`
- `lib/auth.ts` - Requires `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `app/actions/send-invoice.tsx` - Requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, uses `ALLOWED_LOGO_HOSTS`, `NEXT_PUBLIC_APP_URL`, `APP_URL`
- `app/api/support/route.ts` - Requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPPORT_EMAIL`

**Runtime Failures:**
- **No `RESEND_API_KEY`**: Invoice email sending fails silently with error toast (line 41-44 of `send-invoice.tsx`)
- **No `DATABASE_URL`**: App crashes on any DB query
- **No `NEXTAUTH_SECRET`**: Authentication breaks, users cannot login

**Recommendation:**
1. Add `.env.example` file with all required vars
2. Add startup validation script to check required env vars
3. Implement graceful degradation for email features if Resend not configured

---

#### 2. **Build-time vs Runtime Environment Variables** ⚠️ (P1)

**Issue:**
- Next.js distinguishes between build-time (`NEXT_PUBLIC_*`) and runtime env vars
- `NEXT_PUBLIC_APP_URL` available in client-side code, but code also uses `APP_URL` (server-side only)
- Confusion between which to use where

**Files:**
```tsx
// app/actions/send-invoice.tsx (lines 10-15)
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.APP_FALLBACK_URL ?? "https://zzp-hub.nl");
```

**Problem:**
- Hardcoded fallback `https://zzp-hub.nl` may not match deployment URL
- If deploying to Coolify with custom domain, links in emails will be wrong

**Fix:**
1. Require `NEXT_PUBLIC_APP_URL` to be set in deployment
2. Remove hardcoded fallback domain
3. Throw error if URL not configured:
```tsx
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
if (!APP_BASE_URL) {
  throw new Error("NEXT_PUBLIC_APP_URL must be configured");
}
```

---

#### 3. **No Health Check Endpoint** ⚠️ (P1)

**Issue:**
- Coolify/Docker containers typically need health check endpoint
- App has no `/health` or `/api/health` route
- Cannot verify if app is ready to receive traffic after deployment

**Recommendation:**
Add health check route:
```tsx
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
```

---

#### 4. **Prisma Client Generation in Docker** ⚠️ (P0)

**Issue:**
- Prisma client must be generated after installing dependencies
- If Dockerfile doesn't run `npx prisma generate`, app will crash

**Typical Dockerfile Issue:**
```dockerfile
# Missing this step:
RUN npx prisma generate
```

**Coolify Build Process:**
- Ensure build command includes: `npm install && npx prisma generate && npm run build`

---

#### 5. **Database Migration Strategy** 🔴 (P0)

**Issue:**
- No clear migration strategy for production deployments
- Migrations should run before app starts, but in separate init container

**Risk:**
- If migrations run in same container as app, failed migration can cause downtime
- If migrations don't run, app uses outdated schema and crashes

**Recommendation:**
1. Run migrations in separate init container or pre-deploy hook
2. Use `npx prisma migrate deploy` (not `migrate dev`)
3. Add migration check to health endpoint

**Coolify Pre-Deploy Hook:**
```bash
#!/bin/bash
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "Migration failed"
  exit 1
fi
```

---

#### 6. **PWA Service Worker Cache Issues** ⚠️ (P1)

**Issue:**
- Service worker caches static assets aggressively
- After deployment, users may see old cached version
- No cache busting strategy for new deployments

**Current Config:**
```tsx
// next.config.ts (lines 10-12)
workboxOptions: {
  skipWaiting: true,      // Good: New SW activates immediately
  clientsClaim: true,     // Good: Takes control of existing clients
  // ...
}
```

**Recommendation:**
- `skipWaiting: true` helps, but users still need to refresh
- Add version check or force refresh UI notification when new version detected
- Consider adding "Update Available" banner

---

#### 7. **Missing Logging and Error Tracking** ⚠️ (P1)

**Issue:**
- Console.log statements throughout code (e.g., `app/actions/send-invoice.tsx` line 115)
- No structured logging (JSON format)
- No error tracking integration (Sentry, LogRocket, etc.)
- Hard to debug production issues

**Current Logging:**
```tsx
console.error("Verzenden van factuur e-mail mislukt", error);
```

**Recommendation:**
1. Integrate error tracking (e.g., Sentry):
```tsx
import * as Sentry from "@sentry/nextjs";

try {
  // ... code
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: "invoice-email" },
    extra: { invoiceId },
  });
  console.error("Verzenden mislukt", error);
}
```

2. Add structured logging with metadata

---

### Coolify-Specific Considerations

**Environment Variables:**
- Coolify requires env vars to be set in UI before deployment
- Use "Build-time" env vars for `NEXT_PUBLIC_*`
- Use "Runtime" env vars for server-only secrets

**Database:**
- If using Coolify's managed Postgres, get `DATABASE_URL` from Coolify dashboard
- Ensure connection pooling configured if using Prisma in serverless/container

**Networking:**
- Coolify exposes app via reverse proxy
- Ensure `NEXTAUTH_URL` matches public domain
- Trust proxy headers if behind Cloudflare/reverse proxy

**Persistence:**
- If storing uploaded logos locally (not recommended), mount persistent volume
- Better: Use S3/R2/Cloudinary for file uploads

---

## 6) Action Plan

### P0 (Must Fix Before Selling) 🔴

| Task | Scope | Complexity | Files |
|------|-------|------------|-------|
| **Split invoice email/payment status** | Add separate `emailStatus` and `paymentStatus` fields to Invoice model, migrate data | **L (4-6h)** | `prisma/schema.prisma`, `app/(dashboard)/facturen/page.tsx`, `app/actions/invoice-actions.ts`, `app/actions/send-invoice.tsx`, migration SQL |
| **Add .env.example file** | Document all required environment variables with descriptions | **S (30min)** | `.env.example` (new file) |
| **Fix invoice mobile actions visibility** | Ensure InvoiceActionsMenu is accessible on mobile cards | **S (1h)** | `app/(dashboard)/facturen/page.tsx` (lines 166-175) |
| **Add environment validation on startup** | Script to check required env vars before app starts | **M (2h)** | `lib/env-validation.ts` (new), `app/layout.tsx` or server entry |
| **Fix onboarding tour mobile overlay** | Adjust spotlight and tour card positioning for mobile screens | **M (2-3h)** | `components/onboarding/onboarding-tour.tsx` (lines 106-150) |
| **Add health check endpoint** | `/api/health` route for monitoring and Coolify health checks | **S (1h)** | `app/api/health/route.ts` (new) |
| **Remove hardcoded fallback domain** | Make `NEXT_PUBLIC_APP_URL` required, remove `https://zzp-hub.nl` fallback | **S (30min)** | `app/actions/send-invoice.tsx` (lines 10-15) |
| **Implement custom confirmation dialogs** | Replace `window.confirm()` with styled modal component | **M (3h)** | `components/ui/confirm-dialog.tsx` (new), `app/(dashboard)/facturen/_components/invoice-actions-menu.tsx` (line 62) |

**Estimated Total: 14-18 hours**

---

### P1 (Should Fix Soon) 🟡

| Task | Scope | Complexity | Files |
|------|-------|------------|-------|
| **Add EmailLog model** | Track all emails sent (invoice, support, etc.) for audit and debugging | **M (3-4h)** | `prisma/schema.prisma`, `app/actions/send-invoice.tsx`, `app/api/support/route.ts`, new admin view page |
| **Store onboarding in database** | Move from localStorage to User model for cross-device sync | **M (2-3h)** | `prisma/schema.prisma`, `components/onboarding/onboarding-tour.tsx`, new server action |
| **Add active route highlighting to sidebar** | Visual indicator of current page in navigation | **S (1h)** | `components/layout/sidebar.tsx`, `components/sidebar/*` |
| **Add loading states to forms** | Spinners and disabled states during form submission | **S (1-2h)** | `app/(dashboard)/facturen/nieuw/invoice-form.tsx`, `app/(dashboard)/instellingen/settings-form.tsx` |
| **Fix settings tabs URL sync** | Update URL params when switching tabs for shareable links | **S (1h)** | `app/(dashboard)/instellingen/settings-tabs.tsx` (line 82) |
| **Redesign line item editing for mobile** | Card-based layout instead of cramped grid on small screens | **M (3-4h)** | `app/(dashboard)/facturen/nieuw/invoice-form.tsx`, `components/forms/*` |
| **Add Sentry error tracking** | Integrate error monitoring for production debugging | **M (2h)** | Install package, `sentry.client.config.ts`, `sentry.server.config.ts`, update error handlers |
| **Add logo display in dashboard header** | Show company logo in header if uploaded | **S (1h)** | `app/(dashboard)/layout.tsx` (line 40-45) |
| **Shorten KPI trend labels on mobile** | Truncate or abbreviate long trend text for small screens | **S (30min)** | `app/(dashboard)/dashboard/page.tsx` (line 126-128) |

**Estimated Total: 14-19 hours**

---

### P2 (Nice to Have) 🟢

| Task | Scope | Complexity | Files |
|------|-------|------------|-------|
| **Build real support ticket system** | Full ticket CRUD, admin interface, replies, status tracking | **L (8-12h)** | `prisma/schema.prisma`, `app/(dashboard)/support/*`, `app/(dashboard)/admin/tickets/*`, new API routes |
| **Add empty states to dashboard** | CTAs for new users with no invoices/expenses yet | **S (1h)** | `app/(dashboard)/dashboard/page.tsx` (lines 199-251) |
| **Add email quotation feature** | Send quotations via email like invoices | **M (3-4h)** | `app/actions/send-quotation.tsx` (new), `components/emails/QuotationEmail.tsx` (new), UI updates |
| **Implement file upload for logos** | Local or S3/R2 storage instead of just URL input | **M (4-5h)** | New upload endpoint, storage integration, `app/(dashboard)/instellingen/actions.ts` |
| **Add push notifications for PWA** | Notify users of payment reminders, new features | **L (6-8h)** | Service worker updates, notification API integration, backend scheduling |
| **Add offline fallback page** | Custom offline page for PWA when no internet | **S (1-2h)** | `app/offline/page.tsx` (new), service worker config |
| **Build recurring invoice feature** | Schedule invoices to auto-create monthly/quarterly | **L (8-10h)** | `prisma/schema.prisma` (RecurringInvoice model), cron job/scheduler, new UI |
| **Add invoice payment link integration** | Stripe/Mollie payment links in emails | **L (6-8h)** | Payment provider integration, webhook handling, UI updates |
| **Implement multi-language support** | English + Dutch (currently Dutch only) | **L (10-12h)** | i18n setup, translate all strings, language switcher UI |
| **Add analytics dashboard** | Track invoice trends, payment rates, revenue forecasts | **M (4-6h)** | New analytics page, chart components, data aggregation |

**Estimated Total: 51-70 hours**

---

### Summary of Priorities

**Pre-Launch Blockers (P0):** ~14-18 hours
- Critical fixes for production stability
- User experience issues on mobile
- Deployment safety

**Post-Launch Improvements (P1):** ~14-19 hours
- Better tracking and debugging
- Enhanced UX polish
- Cross-device sync

**Future Enhancements (P2):** ~51-70 hours
- Advanced features for competitive advantage
- Automation and integrations
- Scalability improvements

**Total Estimated Work:** 79-107 hours for full roadmap

---

## Conclusion

**ZZP-HUB is a well-architected Next.js SaaS application** with:
- ✅ Solid foundation (Next.js 16, TypeScript, Prisma, Tailwind)
- ✅ Core features working (invoices, quotations, clients, dashboard)
- ✅ Good SEO/PWA setup (metadata, manifest, icons)
- ⚠️ Schema issues that need fixing (email/payment status mixing)
- ❌ Missing critical features for production (email logs, support tickets, DB onboarding)
- ⚠️ Mobile UX needs polish (forms, overlays, actions)
- 🔴 Deployment risks (env var validation, health checks, migrations)

**Recommendation:** Complete all P0 tasks (14-18 hours) before launching to paying customers. The invoice status schema issue is the most critical technical debt that will cause problems as the user base grows.

The codebase is clean, well-structured, and ready for rapid iteration. Most P1 and P2 features can be added incrementally post-launch based on user feedback.
