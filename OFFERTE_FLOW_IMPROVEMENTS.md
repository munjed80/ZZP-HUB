# AI Assist "Create Offerte" Flow Improvements

## Overview
This document describes the improvements made to the AI Assist offerte creation flow to make it more robust, user-friendly, and prevent generic documentation responses when users want to create quotations.

## Changes Implemented

### 1. Enhanced Intent Detection
- **Priority-based keyword matching**: Offerte keywords are now checked FIRST to prevent the system from falling back to generic documentation responses
- **Extended keyword list**: Added "maak een offerte" and "create quote" to the detection keywords
- **Dutch and English support**: Both `offerte`, `quotation`, `quote`, and `aanbieding` are recognized

**File**: `lib/ai/router/index.ts` - `detectIntent()` function

### 2. Robust Free-Text Parsing
Implemented a new `extractOfferteParams()` function that supports multiple natural language patterns:

#### Supported Patterns:
1. **Pattern 1**: `<client> <qty> <item> price <unitPrice>`
   - Example: `"Riza 320 stops price 1.25"`
   - Example: `"Jan 100 uren prijs 50"`

2. **Pattern 2**: `<qty>x <item> @ <unitPrice> for <client>`
   - Example: `"320x stops @ 1.25 for Riza"`
   - Example: `"100 uren @ 50 voor Jan"`

3. **Pattern 3**: `<client> <item> <qty> stuks <unitPrice>`
   - Example: `"Riza stops 320 stuks 1.25"`

#### Features:
- Automatically strips common prefixes like "maak een offerte", "create quote", etc.
- Handles both comma (`,`) and period (`.`) as decimal separators
- Supports euro symbol (`€`) in prices
- Supports both Dutch (`prijs`, `voor`) and English (`price`, `for`) keywords
- Falls back to simpler extraction when structured patterns don't match

**File**: `lib/ai/router/index.ts` - `extractOfferteParams()` function

### 3. Improved Missing Fields Handling
- **Specific, concise questions**: Instead of generic messages, the system now asks focused questions in Dutch:
  - Missing client: `"Welke klantnaam?"`
  - Missing items: `"Welke items/aantal/prijs?"`
- **One question at a time**: Only asks for the first missing field to avoid overwhelming the user
- **Default VAT rate**: Automatically defaults to 21% if not specified

**File**: `lib/ai/router/index.ts` - `handleCreateOfferte()` function

### 4. Confirmation Step with Preview
Before creating the database record, the system now:
- Shows a compact preview with:
  - Client name
  - Line items with quantity and unit price
  - Subtotal, VAT amount (with rate shown), and total
- Asks for confirmation in Dutch: `"Bevestigen? (Ja/Nee)"`
- Sets `needsConfirmation: true` in the response

**File**: `lib/ai/router/index.ts` - `handleCreateOfferte()` function

### 5. Type-Safe Message Contract
- **API-level validation**: Added safeguard in the API route to ensure `message` field is always a string
- **Fallback message**: If the router doesn't provide a message, the API returns a default: `"Uw verzoek is verwerkt."`
- **Zod validation**: Schema already supports items-based offerte creation with proper validation

**Files**: 
- `app/api/ai/chat/route.ts` - API response validation
- `lib/ai/schemas/actions.ts` - Existing Zod schemas (already correct)

### 6. Comprehensive Unit Tests
Created 23 comprehensive tests covering:

#### Intent Detection Tests (6 tests):
- Dutch keyword recognition
- English keyword recognition  
- Quotation keyword
- Priority over invoice keywords
- Invoice detection when no offerte keywords
- Default to question intent

#### Parsing Tests (14 tests):
- All three supported patterns
- Dutch and English keywords
- Euro symbol handling
- Comma and period decimal separators
- Multi-word client names
- Multi-word item descriptions
- VAT rate extraction (21%, 9%, 0%)
- Default VAT to 21%
- Fallback extraction patterns

#### Integration Tests (3 tests):
- Full flow from intent detection to parsing
- Missing client name detection
- Missing items detection

**Test Results**: All 23 tests passing ✓

**File**: `tests/offerte-flow.test.mjs`

## Example Usage

### Example 1: Simple offerte creation
**User**: `"offerte Riza 320 stops price 1.25"`

**System Response**:
```
Offerte preview voor Riza:

- stops: 320x €1.25

Subtotaal: €400.00
BTW (21%): €84.00
Totaal: €484.00

Bevestigen? (Ja/Nee)
```

### Example 2: Alternative format
**User**: `"320x widgets @ 15.50 for John Doe"`

**System Response**:
```
Offerte preview voor John Doe:

- widgets: 320x €15.50

Subtotaal: €4960.00
BTW (21%): €1041.60
Totaal: €6001.60

Bevestigen? (Ja/Nee)
```

### Example 3: Missing client name
**User**: `"offerte 100 items price 10"`

**System Response**: `"Welke klantnaam?"`

### Example 4: Missing items
**User**: `"offerte voor TestClient"`

**System Response**: `"Welke items/aantal/prijs?"`

## Benefits

1. **No more generic docs**: Users asking to create an offerte will NEVER get generic documentation responses
2. **Natural language**: Supports multiple natural ways of expressing an offerte request
3. **User-friendly**: Clear, concise Dutch prompts for missing information
4. **Safe**: Always shows a preview before creating database records
5. **Type-safe**: Strong typing ensures UI receives consistent, valid data
6. **Well-tested**: 23 comprehensive tests ensure reliability

## Testing

Run the offerte flow tests:
```bash
node tests/offerte-flow.test.mjs
```

All 23 tests should pass.

## Technical Details

### Dependencies
- Zod: For schema validation (already in project)
- No new dependencies added

### Files Modified
1. `lib/ai/router/index.ts` - Core routing and parsing logic
2. `app/api/ai/chat/route.ts` - API response validation
3. `tests/offerte-flow.test.mjs` - New comprehensive test suite

### Linting
All code passes ESLint with no errors:
```bash
npm run lint
```

## Future Enhancements

Potential improvements for future iterations:
1. Support for multiple line items in a single request
2. Support for custom VAT rates per line item
3. Support for notes/descriptions in natural language
4. Support for due dates and validity periods in requests
5. AI-powered client name fuzzy matching for typos
