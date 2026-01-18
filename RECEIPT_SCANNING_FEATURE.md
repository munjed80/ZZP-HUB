# Receipt Scanning & Auto-Add Feature

This feature allows ZZP users to upload receipt/invoice photos or PDFs, automatically extract key information, and create draft expenses that can be reviewed and approved before being added to the system.

## Overview

The receipt scanning feature implements a complete workflow:
1. Upload a receipt/invoice (image or PDF)
2. Extract data automatically (with placeholder parser, ready for OCR/AI)
3. Create a DRAFT expense with extracted fields
4. Review, edit, and approve the draft
5. Approved expenses become ACTIVE and are included in VAT calculations

## Architecture

### Database Models

#### UploadAsset
Stores uploaded files with multi-tenant security:
- `userId`: Tenant key (isolates data by user)
- `filename`: Original filename
- `mimeType`: File MIME type
- `size`: File size in bytes
- `storagePath`: Local file system path
- `storageUrl`: URL for accessing the file

#### ExtractedDocument
Tracks extraction results:
- `userId`: Tenant key
- `assetId`: Links to UploadAsset
- `status`: PENDING, EXTRACTED, or FAILED
- `extractedJson`: Structured extraction data
- `confidenceScore`: 0-100 confidence level
- `errorMessage`: Error details if extraction failed

#### Expense (Extended)
Now supports draft workflow:
- `status`: DRAFT, PENDING_REVIEW, APPROVED, or REJECTED
- `approvedBy`: User ID of approver
- `approvedAt`: Approval timestamp

#### AuditLog
Records all changes for compliance:
- `userId`: Resource owner
- `actorId`: User who made the change
- `entityType`: Type of entity (e.g., "Expense")
- `entityId`: ID of the entity
- `action`: Action performed (e.g., "APPROVE_DRAFT")
- `beforeJson`: State before change
- `afterJson`: State after change

### Multi-Tenant Security

**All operations are scoped by userId**:
- `requireTenantContext()` enforces authentication and returns userId
- All database queries include `where: { userId }` filter
- File uploads are stored in user-specific directories
- No cross-tenant data leakage possible

### Extraction Service

The extraction service uses a plugin architecture:

```typescript
interface DocumentExtractor {
  extractDocument(assetPath: string, mimeType: string): Promise<ExtractionResult>;
}
```

**Current Implementation**: PlaceholderParser
- Returns empty extraction data
- Requires manual input of all fields
- Provides warnings to user

**Future Integration**: Easy to swap for:
- Tesseract.js (client-side OCR)
- AWS Textract
- Google Vision API
- Custom ML models

### File Storage

**Current**: Local filesystem
- Files stored in `/tmp/zzp-uploads/{userId}/`
- Scoped by userId at filesystem level
- Suitable for development/testing

**Production Ready**: Easy migration to:
- Vercel Blob Storage
- AWS S3
- Azure Blob Storage
- Google Cloud Storage

Just implement the same interface in `lib/storage/file-storage.ts`.

## API Routes

### POST /api/upload

Upload a receipt/invoice and trigger extraction.

**Request**: multipart/form-data
- `file`: File to upload (image or PDF)

**Response**:
```json
{
  "success": true,
  "asset": {
    "id": "asset-uuid",
    "filename": "receipt.jpg",
    "storageUrl": "/api/files/{userId}/file.jpg"
  },
  "extraction": {
    "id": "extraction-uuid",
    "status": "EXTRACTED",
    "data": {
      "totalAmount": 49.99,
      "vatRate": "HOOG_21",
      "date": "2024-01-15",
      "vendorName": "Office Supplies Inc"
    },
    "confidence": 0,
    "warnings": [
      "Automatische extractie is nog niet geïmplementeerd.",
      "Vul de velden handmatig in."
    ]
  }
}
```

**Security**:
- Validates file type (JPG, PNG, WebP, PDF only)
- Validates file size (max 10MB)
- Scoped by userId (from session)
- CSRF protection via NextAuth

## Server Actions

### getDrafts()
Returns all DRAFT and PENDING_REVIEW expenses for current user.

### createDraftFromExtraction(params)
Creates a DRAFT expense from extraction data.

### updateDraft(draftId, data)
Updates a draft (only if not APPROVED).

### approveDraft(draftId)
Approves a draft, changing status to APPROVED.
- Logs approval in AuditLog
- Revalidates /drafts and /uitgaven paths

### rejectDraft(draftId, reason?)
Rejects a draft, changing status to REJECTED.

### deleteDraft(draftId)
Deletes a draft (not allowed if APPROVED).

## UI Components

### /upload
Upload page with:
- File upload button (desktop)
- Camera-friendly on mobile
- Drag-and-drop support
- Real-time validation
- Extraction preview
- Edit form for extracted data

### /drafts
Drafts management page with:
- List of all drafts
- Status badges (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- Approve/Reject/Delete actions
- VAT calculation preview
- Receipt attachment indicator

### Navigation
- "Upload Bon" menu item
- "Concepten" menu item with badge (future: show count)

## Workflow Example

### User Flow
1. User clicks "Upload Bon" in sidebar
2. User selects a receipt photo from camera or files
3. System uploads and extracts data
4. User reviews extracted fields (can edit)
5. User clicks "Opslaan als concept"
6. Redirected to /drafts
7. User reviews draft and clicks "Goedkeuren"
8. Draft becomes APPROVED expense
9. Shows up in /uitgaven and VAT calculations

### Accountant Flow (Future)
1. ZZP user marks draft as "PENDING_REVIEW"
2. Accountant sees drafts in their view
3. Accountant can match vendor, adjust amounts
4. Accountant approves or requests changes
5. Approved expense syncs to ZZP's records

## VAT Calculation Integration

**CRITICAL**: Only APPROVED expenses are included in VAT calculations.

The `getExpenses()` action filters:
```typescript
where: { userId, status: "APPROVED" }
```

This ensures:
- Drafts don't affect totals
- BTW-aangifte is accurate
- Reports only include final data

## Security Checklist

✅ Multi-tenant isolation via userId scoping
✅ All queries include `where: { userId }`
✅ File storage scoped by userId
✅ requireTenantContext() on all actions
✅ File type validation (images + PDF only)
✅ File size validation (max 10MB)
✅ CSRF protection via NextAuth
✅ Audit logging for all changes
✅ No cross-tenant data leakage
✅ Defensive filters everywhere

## Performance Considerations

- **File Upload**: Async processing after upload
- **Extraction**: Runs in background (future: queue)
- **Database**: Indexed on userId, status, createdAt
- **Pagination**: getDrafts() returns recent 50 by default

## Future Enhancements

### Immediate (MVP+)
- [ ] Add draft count badge on "Concepten" menu
- [ ] Add "Send to accountant" button
- [ ] Email notifications for pending reviews

### Short-term
- [ ] Integrate real OCR (Tesseract.js or cloud service)
- [ ] Add vendor autocomplete/matching
- [ ] Bulk approve/reject
- [ ] Export drafts to CSV

### Long-term
- [ ] ML model training on approved receipts
- [ ] Mobile app with native camera
- [ ] Receipt scanning via email
- [ ] Automatic categorization
- [ ] Duplicate detection

## Testing

### Manual Testing Steps
1. Start app: `npm run dev`
2. Login as test user
3. Navigate to "Upload Bon"
4. Upload a receipt image
5. Verify extraction preview shows
6. Edit extracted fields
7. Save as draft
8. Navigate to "Concepten"
9. Verify draft appears in list
10. Click "Goedkeuren"
11. Verify draft disappears from /drafts
12. Navigate to "Uitgaven"
13. Verify approved expense appears
14. Check BTW-aangifte includes the expense

### Security Testing
1. Create Draft as User A
2. Try to access Draft as User B (should fail)
3. Verify all queries include userId filter
4. Upload invalid file type (should reject)
5. Upload oversized file (should reject)

## Migration

To apply the database changes in production:

```bash
# Review the migration
cat prisma/migrations/20260118154000_add_receipt_scanning_models/migration.sql

# Apply migration
npx prisma migrate deploy
```

## Troubleshooting

### Upload fails with 401
- Check that user is logged in
- Verify session is valid

### Extraction always returns empty data
- This is expected with PlaceholderParser
- User must fill fields manually
- Integrate OCR service for auto-extraction

### Drafts don't show in /uitgaven
- Correct! Only APPROVED expenses show there
- Drafts are in /drafts page only

### File storage errors
- Check UPLOAD_DIR environment variable
- Verify write permissions on /tmp/zzp-uploads
- Ensure disk space available

## Code Organization

```
lib/
  extraction/
    types.ts        # Extraction service interface
    parser.ts       # Placeholder parser implementation
  storage/
    file-storage.ts # File upload/storage utilities
  audit.ts          # Audit logging utilities

app/(dashboard)/
  upload/
    page.tsx           # Upload page (server component)
    upload-client.tsx  # Upload UI (client component)
  drafts/
    page.tsx           # Drafts page (server component)
    drafts-client.tsx  # Drafts UI (client component)
    actions.ts         # Draft management actions

app/api/
  upload/
    route.ts        # File upload endpoint

prisma/
  schema.prisma   # Database models
  migrations/
    20260118154000_add_receipt_scanning_models/
      migration.sql  # SQL migration
```

## Environment Variables

```bash
# File storage directory (optional)
UPLOAD_DIR=/tmp/zzp-uploads

# Database (required)
DATABASE_URL=postgresql://...
```

## Dependencies

No new dependencies required! Uses existing:
- Next.js 16.1.1
- Prisma 6.1.0
- NextAuth (authentication)
- React Hook Form + Zod (forms)
- Tailwind CSS (styling)

## License

Part of ZZP-HUB platform.
