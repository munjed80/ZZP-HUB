# Accountant BTW Control Center - Study & Design Document

> **Study only - No code changes implemented**  
> **Date:** 2026-01-25

---

## Part 1: Current Accountant Experience Analysis

### 1.1 How Accountants Enter the System

**Current Flow:**
1. ZZP (company owner) sends invitation via `/instellingen` → Accountant section
2. System generates secure token + 6-digit OTP code
3. Accountant receives email with link/code
4. Accountant opens `/accept-invite?token=...` or `/accountant-verify?token=...`
5. System validates, creates shadow user if needed, creates session cookie
6. Accountant redirected to `/accountant` portal page (company selector)

**Data Model:** CompanyUser model with CompanyRole.ACCOUNTANT + granular permissions (canRead, canEdit, canExport, canBTW)

### 1.2 Company Context Switching

**Mechanism:**
- Cookie-based: `zzp-hub-active-company` stores active company UUID
- Route handler: `/switch-company?companyId=X&next=/dashboard`
- Context utility: `lib/auth/company-context.ts` with `getActiveCompanyContext()`

**Process:**
1. Accountant views company list at `/accountant`
2. Clicks "Open dashboard" on a company card
3. System sets cookie and redirects to `/dashboard`
4. All subsequent queries scoped by `activeCompanyId`

### 1.3 What Accountant Sees vs Normal ZZP User

| Feature | ZZP User | Accountant |
|---------|----------|------------|
| Dashboard | Full with all stats | Limited to financial stats |
| Navigation | Full menu (11+ items) | Restricted: Overzicht, Facturen, Uitgaven, BTW-aangifte, Support |
| Facturen | Create, edit, delete | View-only or edit based on canEdit permission |
| Relaties | Full CRUD | No access (blocked) |
| Offertes | Full CRUD | No access (blocked) |
| Agenda | Full access | No access (blocked) |
| Uren | Full access | No access (blocked) |
| AI Assist | Full access | No access (blocked) |
| Instellingen | Full access | No access (blocked) |
| BTW page | Full access | Access based on canBTW permission |
| Export | Always | Based on canExport permission |

### 1.4 Current BTW, Invoices, Expenses, and Hours Flow for Accountants

**BTW-aangifte Page (`/btw-aangifte`):**
- Quarter/year selector with "Berekenen" button
- Shows official Dutch tax rubrieken (1a, 1b, 1e)
- Displays: Omzet (revenue), verschuldigde BTW (VAT due), voorbelasting (input VAT)
- Final calculation: "Te betalen" or "Terug te vragen"
- No direct export or download options on this page

**BTW Focus Widget:**
- Available in dossier view
- Shows: BTW te betalen, BTW te ontvangen, difference
- "Genereer BTW-rapport" button
- Link to full BTW-aangifte page

**Invoices Page (`/facturen`):**
- List view with status badges (Concept, Open, Betaald, Te laat)
- View individual invoices
- Export available via separate button
- No bulk operations for review/approval

**Expenses Page (`/uitgaven`):**
- List view with category, amount, VAT rate
- Export button available
- No review status visible
- No batch operations

**Hours (Uren):**
- Accountants do NOT have access to time tracking
- This data is completely hidden from accountants

---

## Part 2: Comparison with SnelStart Accountant Mode

### 2.1 What the Accountant Sees First in SnelStart

**SnelStart Approach:**
- Accountant-first dashboard showing ALL clients at a glance
- Client list with status indicators (needs attention, deadlines)
- Quick filters: "BTW deadlines this week", "Needs review", "Completed"
- Aggregated view of outstanding issues across all clients
- One-click access to any client's full administration

**ZZP-HUB Current:**
- Company cards with basic info (name, role badge, permissions)
- No status indicators or deadlines on the overview
- No filtering capabilities
- Must click into each company to see any financial data

### 2.2 How BTW Reporting is Accessed in SnelStart

**SnelStart Approach:**
- BTW overview is a dedicated "Control Center"
- Shows all periods at once (not just current quarter)
- Color-coded status: Ready, Missing data, Submitted
- One-click export to Belastingdienst format
- Audit trail visible
- Manual corrections with reason field
- Locking mechanism to prevent changes after submission

**ZZP-HUB Current:**
- Single quarter view at a time
- Must manually switch quarters
- No submission status tracking
- No audit trail visible
- No locking mechanism
- Report generation exists but isn't prominently featured

### 2.3 How Clients Are Managed in SnelStart

**SnelStart Approach:**
- Bulk operations across multiple clients
- Status dashboard showing all clients' health
- Automated alerts for missing data
- Period close workflow with checklist
- Notes/annotations visible at client level

**ZZP-HUB Current:**
- One company at a time context
- Must switch context to view each client
- No cross-client reporting
- No period close workflow
- Notes exist but not prominently featured

---

## Part 3: Key Gaps Identified

### Critical Gaps

1. **No Multi-Client BTW Overview**
   - Cannot see BTW status for all clients on one screen
   - Must visit each company individually to check BTW status

2. **No Deadline Tracking**
   - No visual indicator of upcoming BTW deadlines
   - No automated reminders or urgency indicators

3. **No Bulk Export**
   - Cannot export BTW data for multiple companies at once
   - Each export requires navigating to individual company

4. **No Period Lock/Submit Workflow**
   - No way to mark a period as "submitted" or "reviewed"
   - No protection against accidental changes after filing

5. **No Audit Trail Visibility**
   - Accountant cannot see history of changes
   - No way to verify what was changed and when

6. **No Cross-Company Reporting**
   - Cannot generate summary reports across all clients
   - No portfolio-level analytics

### Moderate Gaps

7. **Limited Dashboard Filtering**
   - No filter for "needs attention" companies
   - No quick filters for status

8. **No Manual Correction System**
   - No structured way to make BTW corrections
   - No reason/justification field for adjustments

9. **Missing Comparison View**
   - Cannot compare current period vs previous
   - No trend analysis

10. **No BTW Submission Integration**
    - Cannot directly submit to Belastingdienst
    - No status tracking for submissions

---

## Part 4: UX Pain Points for Accountants

### High Priority Pain Points

1. **Too Many Clicks to Get BTW Data**
   - Current: Portal → Company → Dashboard → BTW-aangifte → Select quarter
   - Ideal: Portal → BTW Overview (all companies, all quarters)

2. **Context Switching Friction**
   - Must constantly switch between companies
   - Loses mental context when switching
   - No "recently viewed" or favorites

3. **No "Work Queue" Concept**
   - Accountant must remember which companies need attention
   - No task list or prioritization

4. **BTW Page is User-Focused, Not Accountant-Focused**
   - Shows education text for ZZP users ("Let op: Als je meedoet aan de KOR...")
   - Accountants don't need this guidance
   - Takes valuable screen space

5. **No Batch Operations**
   - Cannot mark multiple items as reviewed
   - Cannot export multiple periods at once

### Medium Priority Pain Points

6. **No Keyboard Shortcuts**
   - Power users cannot navigate quickly
   - Everything requires mouse clicks

7. **Limited Export Formats**
   - No direct Belastingdienst format
   - No MT940 or other standard formats

8. **No Draft/Publish Workflow for Reports**
   - Cannot prepare reports in advance
   - No review before finalizing

9. **Mobile Experience Not Optimized for Accountants**
   - Reviewing BTW on mobile is difficult
   - Tables don't work well on small screens

10. **No Integration with External Tools**
    - Cannot sync with accounting software
    - Manual data transfer required

---

## Part 5: What Should Become "Accountant-First"

### Must Change to Accountant-First

| Current User-First | Should Be Accountant-First |
|-------------------|---------------------------|
| Single company context | Multi-company overview |
| Current quarter focus | All periods visible |
| Educational tooltips | Professional summaries |
| Individual exports | Bulk export options |
| No deadlines | Deadline-driven workflow |
| Manual tracking | Automated status tracking |

### Specific Recommendations

1. **Portal Landing Page**
   - Change from company list to "Deadlines & Action Items" dashboard
   - Show urgent items first (BTW deadlines within 7 days)
   - Aggregate statistics across all companies

2. **BTW-aangifte Page**
   - Remove educational content for accountants
   - Add period status (Draft, Reviewed, Submitted)
   - Add quick export to official format
   - Add manual correction workflow

3. **Export Functionality**
   - Add "Export all companies" option
   - Add scheduled exports (daily/weekly reports)
   - Add Belastingdienst-ready format

4. **Review Workflow**
   - Add batch review capabilities
   - Add review status visible in lists
   - Add review notes/annotations

---

## Part 6: Accountant-First BTW Control Center Design

### 6.1 Page Structure (Sections)

```
┌─────────────────────────────────────────────────────────────────────┐
│  BTW Control Center                                    [Q4 2025 ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECTION 1: Deadline Alert Bar (if deadlines within 7 days) │   │
│  │  "⚠️ 3 companies have BTW deadline on Jan 31, 2026"  [View] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECTION 2: Quick Stats Row                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │   │
│  │  │ 12       │ │ 8        │ │ 3        │ │ €42,580      │    │   │
│  │  │ Klanten  │ │ Gereed   │ │ Actie    │ │ Totaal BTW   │    │   │
│  │  │          │ │ ✓        │ │ nodig    │ │ te betalen   │    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECTION 3: Filters & Actions Bar                           │   │
│  │  [Alle] [Actie nodig] [Gereed] [Ingediend]    [↓ Export All]│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECTION 4: Company BTW Table                               │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ □ Company      | Status   | BTW Due  | Deadline | Act  │ │   │
│  │  ├────────────────────────────────────────────────────────┤ │   │
│  │  │ □ Bedrijf A    | ✓ Gereed | €2,450   | 31 jan  | [>]  │ │   │
│  │  │ □ Bedrijf B    | ⚠ Actie  | €1,230   | 31 jan  | [>]  │ │   │
│  │  │ □ Bedrijf C    | ✓ Gereed | €8,900   | 31 jan  | [>]  │ │   │
│  │  │ ...                                                     │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECTION 5: Selected Company Detail Panel (expandable)      │   │
│  │                                                              │   │
│  │  Bedrijf A - Q4 2025                           [X Close]    │   │
│  │  ───────────────────────────────────────────────────────    │   │
│  │                                                              │   │
│  │  Rubriek 1a (21%):  Omzet €15,000  BTW €3,150              │   │
│  │  Rubriek 1b (9%):   Omzet €2,000   BTW €180                │   │
│  │  Rubriek 1e (0%):   Omzet €1,000   BTW €0                  │   │
│  │  Voorbelasting:     €880                                    │   │
│  │  ───────────────────────────────────────────────────────    │   │
│  │  TE BETALEN:        €2,450                                  │   │
│  │                                                              │   │
│  │  [Correctie toevoegen] [Exporteren] [Markeer als gereed]   │   │
│  │                                                              │   │
│  │  Correcties & Notities:                                     │   │
│  │  └─ "Handmatige correctie +€50 - ontbrekende factuur #123" │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SECTION 6: Bulk Actions Bar (when items selected)          │   │
│  │  "3 bedrijven geselecteerd"                                 │   │
│  │  [Markeer gereed] [Exporteer selectie] [Vergelijk periodes] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Required Actions (Buttons)

**Top Level Actions:**
| Button | Description | Permission |
|--------|-------------|------------|
| Period Selector | Dropdown to select quarter/year | canRead |
| Export All | Download all companies' BTW data for selected period | canExport |
| Refresh Data | Recalculate all BTW data from source records | canRead |

**Filter Actions:**
| Filter | Behavior |
|--------|----------|
| Alle | Show all companies |
| Actie nodig | Show companies with missing data or unreviewed items |
| Gereed | Show companies ready for submission |
| Ingediend | Show companies already submitted this period |

**Per-Company Actions:**
| Button | Description | Permission |
|--------|-------------|------------|
| Expand/View Detail | Show full BTW breakdown | canRead |
| Correctie toevoegen | Add manual correction with reason | canEdit |
| Exporteren | Download BTW report for this company | canExport |
| Markeer als gereed | Lock period as reviewed/ready | canBTW |
| View Facturen | Quick link to invoices for this period | canRead |
| View Uitgaven | Quick link to expenses for this period | canRead |

**Bulk Actions (when multiple selected):**
| Button | Description | Permission |
|--------|-------------|------------|
| Markeer gereed | Mark all selected as reviewed | canBTW |
| Exporteer selectie | Download combined report | canExport |
| Vergelijk periodes | Show comparison with previous period | canRead |

### 6.3 Data Sources (High-Level)

```typescript
interface BTWControlCenterData {
  // Aggregated from all accessible companies
  companies: CompanyBTWStatus[];
  
  // Quick stats
  totalCompanies: number;
  companiesReady: number;
  companiesNeedingAction: number;
  totalBTWDue: number;
  
  // Period info
  selectedPeriod: {
    quarter: 1 | 2 | 3 | 4;
    year: number;
  };
  
  // Deadline info
  upcomingDeadline: Date;
  companiesWithUpcomingDeadline: number;
}

interface CompanyBTWStatus {
  companyId: string;
  companyName: string;
  
  // BTW Calculation (from existing getVatReport function)
  rubriek1a: { base: number; vat: number };
  rubriek1b: { base: number; vat: number };
  rubriek1e: { base: number };
  voorbelasting: number;
  totalDue: number;
  
  // Status tracking (NEW fields needed)
  status: 'draft' | 'needs_review' | 'ready' | 'submitted';
  reviewedAt?: Date;
  reviewedBy?: string;
  submittedAt?: Date;
  
  // Deadline
  deadlineDate: Date;
  
  // Data quality indicators
  hasUnreviewedInvoices: boolean;
  hasUnreviewedExpenses: boolean;
  missingDataWarnings: string[];
  
  // Corrections (NEW model needed)
  corrections: BTWCorrection[];
}

interface BTWCorrection {
  id: string;
  companyId: string;
  period: { quarter: number; year: number };
  rubriek: '1a' | '1b' | '1e' | '5b';
  amount: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}
```

### 6.4 UX Flow for End-of-Quarter Work

```
┌─────────────────────────────────────────────────────────────────┐
│                  END-OF-QUARTER WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

Step 1: OVERVIEW
────────────────
Accountant opens BTW Control Center
→ Sees all companies with status at a glance
→ Identifies companies needing attention (orange/red status)
→ Notes deadline countdown in header

Step 2: TRIAGE
──────────────
For each "Actie nodig" company:
→ Click to expand detail panel
→ Review warnings (missing invoices, unreviewed expenses)
→ Click "View Facturen" or "View Uitgaven" to fix issues
→ Return to Control Center

Step 3: REVIEW & CORRECT
────────────────────────
For each company after data is complete:
→ Expand detail panel
→ Verify rubriek amounts against source data
→ Add corrections if needed (with mandatory reason)
→ Click "Markeer als gereed"

Step 4: BULK EXPORT
───────────────────
Select all "Gereed" companies (checkbox)
→ Click "Exporteer selectie"
→ Download combined report (CSV/XLSX) with all BTW data
→ Ready for filing

Step 5: SUBMISSION TRACKING
───────────────────────────
After filing with Belastingdienst:
→ Mark as "Ingediend" (optional)
→ Period locked from further changes
→ Visible audit trail

Step 6: NEXT PERIOD
───────────────────
Change period selector to next quarter
→ All companies reset to "Draft" status
→ Process repeats
```

### 6.5 How This Differs From Current BTW Page

| Aspect | Current BTW Page | Proposed Control Center |
|--------|------------------|------------------------|
| **Scope** | Single company | All companies |
| **Period** | One quarter at a time | All periods accessible |
| **Navigation** | Deep in company context | Top-level portal page |
| **Status** | No tracking | Draft → Ready → Submitted |
| **Corrections** | Not supported | With reason & audit trail |
| **Export** | Individual only | Bulk + individual |
| **Deadlines** | Not shown | Prominent countdown |
| **Target user** | ZZP user (education focus) | Accountant (efficiency focus) |
| **Actions** | Calculate only | Calculate + Review + Export + Lock |
| **Comparison** | None | Period-over-period available |

---

## Part 7: Database Changes Required (High-Level)

### New Tables Needed

```prisma
model BTWPeriodStatus {
  id          String   @id @default(uuid())
  companyId   String
  year        Int
  quarter     Int
  status      BTWPeriodStatusEnum  // DRAFT, NEEDS_REVIEW, READY, SUBMITTED
  reviewedAt  DateTime?
  reviewedBy  String?
  submittedAt DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     User     @relation(fields: [companyId], references: [id])
  
  @@unique([companyId, year, quarter])
  @@index([year, quarter])
  @@index([status])
}

model BTWCorrection {
  id          String   @id @default(uuid())
  companyId   String
  year        Int
  quarter     Int
  rubriek     String   // "1a", "1b", "1e", "5b"
  amount      Decimal  @db.Decimal(12, 2)
  reason      String
  createdBy   String
  createdAt   DateTime @default(now())
  
  company     User     @relation(fields: [companyId], references: [id])
  
  @@index([companyId, year, quarter])
}

enum BTWPeriodStatusEnum {
  DRAFT
  NEEDS_REVIEW
  READY
  SUBMITTED
}
```

### Existing Model Modifications

- Add `BTWPeriodStatus` relation to User model
- Add `BTWCorrection` relation to User model

---

## Part 8: Summary & Recommendations

### Immediate Priorities (High Impact, Lower Effort)

1. **Add BTW status to company cards** - Show deadline & status on portal
2. **Add period selector to portal** - Quick switch without entering company
3. **Add bulk export button** - Export all companies' BTW data at once
4. **Remove educational text for accountants** - Cleaner, professional UI

### Medium-Term (High Impact, Higher Effort)

5. **Create BTW Control Center page** - New `/accountant/btw-control` route
6. **Add BTWPeriodStatus tracking** - Database + UI changes
7. **Add manual correction system** - New form + audit trail
8. **Add deadline countdown** - Visual indicator in header

### Long-Term (Nice to Have)

9. **Belastingdienst integration** - Direct submission API
10. **Period comparison** - Side-by-side quarter analysis
11. **Automated alerts** - Email notifications for deadlines
12. **Mobile optimization** - Better table views for small screens

---

## Appendix: File References

**Key files reviewed during this study:**

- `app/(dashboard)/btw-aangifte/page.tsx` - Current BTW page
- `app/(dashboard)/btw-aangifte/actions.ts` - BTW calculation logic
- `app/(dashboard)/accountant/page.tsx` - Accountant portal landing
- `components/btw-focus-widget.tsx` - BTW summary widget
- `lib/auth/company-context.ts` - Company switching logic
- `lib/export-helpers.ts` - Export functionality
- `ACCOUNTANT_EXPERIENCE_SUMMARY.md` - Implementation docs
- `docs/ACCOUNTANT_MODE_VERIFICATION.md` - SnelStart comparison notes
- `prisma/schema.prisma` - Data model

---

*End of Study Document*
