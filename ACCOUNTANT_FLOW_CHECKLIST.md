## Accountant flow manual test checklist

- [ ] Login as ZZP directs to `/dashboard`
- [ ] Login as accountant (type=accountant) directs to `/accountant-portal`
- [ ] Accountant cannot reach `/dashboard` (redirected to portal)
- [ ] Accept invite: creates accountant session, lands on `/accountant-portal`
- [ ] Accountant portal lists only granted companies
- [ ] Accessing other `companyId` in portal returns 403/not found
- [ ] Portal dossier shows data limited to selected company and period filters work via URL
