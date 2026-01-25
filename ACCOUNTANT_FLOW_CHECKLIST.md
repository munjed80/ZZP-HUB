## SnelStart-style Accountant Mode - Manual Test Checklist

### Overview
The accountant mode is now company-level membership (not a global UserRole). Same app, same /dashboard, different menu/routes based on active company context and membership type.

### Key Concepts
- **CompanyRole enum**: OWNER | STAFF | ACCOUNTANT
- **Active Company Cookie**: `zzp-hub-active-company` stores the currently selected company ID
- **isOwnerContext**: True when viewing your own company, false when viewing another company as ACCOUNTANT/STAFF

### Test Checklist

#### 1. Company Owner Flow
- [ ] Login as company owner (COMPANY_ADMIN) directs to `/dashboard`
- [ ] Full navigation visible: Facturen, Relaties, Offertes, Uitgaven, BTW, Agenda, Uren, AI Assist, Instellingen
- [ ] Can access all pages without restrictions
- [ ] "Accountant uitnodigen" visible in navigation

#### 2. Invite Accountant Flow
- [ ] Go to `/instellingen` → Accountant section
- [ ] Enter accountant email and send invite
- [ ] Verify invite appears in pending list
- [ ] Check email sent with invite link

#### 3. Accept Invite Flow (New User)
- [ ] Open invite link in incognito/new browser
- [ ] If not logged in, redirected to `/login` with `next` param
- [ ] Register new account with invited email
- [ ] After registration, auto-redirected to accept-invite page
- [ ] Invite accepted, redirected to `/switch-company?companyId=...&next=/dashboard`
- [ ] Cookie `zzp-hub-active-company` is set
- [ ] Lands on `/dashboard` with "Accountant" badge in header

#### 4. Accept Invite Flow (Existing User)
- [ ] Open invite link while logged in with matching email
- [ ] Invite accepted immediately
- [ ] Redirected to `/switch-company?companyId=...&next=/dashboard`
- [ ] Cookie set, lands on dashboard with accountant badge

#### 5. Accountant Mode Navigation
- [ ] When in accountant mode, limited navigation visible
- [ ] Visible: Overzicht, Facturen, Uitgaven, BTW-aangifte, Support
- [ ] Hidden: Relaties, Offertes, Agenda, Uren, AI Assist, Instellingen
- [ ] "Accountant" badge visible in header
- [ ] Company switcher visible if multiple companies

#### 6. Company Switcher
- [ ] Click company switcher to see list of accessible companies
- [ ] Switch to different company
- [ ] Verify URL goes to `/switch-company?companyId=...`
- [ ] After switch, viewing new company's data
- [ ] Badge updates to show current role

#### 7. Server-Side Guards
- [ ] As accountant, navigate to `/instellingen` → Redirected to `/dashboard`
- [ ] As accountant, navigate to `/relaties` → Redirected to `/dashboard`
- [ ] As accountant, navigate to `/offertes` → Redirected to `/dashboard`
- [ ] As accountant, navigate to `/agenda` → Redirected to `/dashboard`
- [ ] As accountant, navigate to `/uren` → Redirected to `/dashboard`
- [ ] As accountant, navigate to `/ai-assist` → Redirected to `/dashboard`

#### 8. Permission-Based Access
- [ ] Accountant with canRead=true can view facturen/uitgaven
- [ ] Accountant with canEdit=false cannot edit facturen/uitgaven
- [ ] Accountant with canBTW=true can access BTW features
- [ ] Accountant with canExport=true can export data

#### 9. Switch Back to Own Company (for Owners)
- [ ] Owner with accountant access to other companies can switch back
- [ ] After switching to own company, full navigation restored
- [ ] No "Accountant" badge when viewing own company

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/active-company` | POST | Set active company cookie |
| `/api/session/active-company` | GET | Get current context & memberships |
| `/switch-company` | GET | Validate access & redirect with cookie |
| `/api/accountants/invite` | POST | Create invite |
| `/api/accountants/accept` | POST | Accept invite |

### Test URLs

1. **Dashboard**: https://your-app.com/dashboard
2. **Settings**: https://your-app.com/instellingen
3. **Accept Invite**: https://your-app.com/accept-invite?token=...
4. **Switch Company**: https://your-app.com/switch-company?companyId=...&next=/dashboard
