# Quick Start: Capacitor Mobile App

## Prerequisites
- Node.js 20+ installed
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- A deployed Next.js application (see CAPACITOR_SETUP.md)

## Steps to Get Mobile App Running

### 1. Deploy Your Next.js App

First, deploy this app to a hosting provider with full Next.js support:

**Recommended Providers:**
- **Vercel** (easiest, official Next.js platform)
  ```bash
  npm install -g vercel
  vercel login
  vercel --prod
  ```

- **Railway**
  ```bash
  # Install Railway CLI and deploy
  npm install -g @railway/cli
  railway login
  railway up
  ```

- **DigitalOcean App Platform**
  - Push to GitHub
  - Connect in DigitalOcean dashboard
  - Deploy

⚠️ **Do NOT use static hosting** (Netlify static, GitHub Pages, etc.) - they won't work!

### 2. Configure Capacitor

Edit `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: "com.zzphub.app",
  appName: "ZZP HUB",
  webDir: "out",
  bundledWebRuntime: false,
  
  server: {
    // Replace with your deployed URL
    url: 'https://your-app.vercel.app',
    cleartext: false  // true only for local development
  }
};
```

### 3. Sync Capacitor

```bash
npm run cap:sync
```

This copies web assets and syncs plugins to native projects.

### 4. Open in Native IDEs

**For Android:**
```bash
npm run cap:open:android
```
- Android Studio will open
- Wait for Gradle sync to complete
- Click the green play button to run on emulator or device

**For iOS (macOS only):**
```bash
npm run cap:open:ios
```
- Xcode will open
- Select a simulator or device
- Click the play button to run

## Development Workflow

### Making Changes

1. **Update Next.js code** as normal
2. **Deploy changes** to your server
3. **Rebuild mobile app** (or just refresh if using live reload)

### Live Reload (Development)

For local development:

1. Start Next.js dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://192.168.1.100:3000',  // Your local IP
     cleartext: true
   }
   ```

3. Sync and run:
   ```bash
   npm run cap:sync
   npm run cap:open:android  # or ios
   ```

Now changes to your Next.js app will reload in the mobile app!

## Building for Production

### Android APK/AAB

1. Open in Android Studio:
   ```bash
   npm run cap:open:android
   ```

2. In Android Studio:
   - Build > Generate Signed Bundle/APK
   - Follow the wizard to create a release build
   - Upload to Google Play Console

### iOS IPA

1. Open in Xcode:
   ```bash
   npm run cap:open:ios
   ```

2. In Xcode:
   - Product > Archive
   - Distribute App
   - Follow wizard to submit to App Store

## Troubleshooting

### App shows blank screen
- Check that your server URL is correct in `capacitor.config.ts`
- Verify your deployed app is accessible from mobile network
- Check browser console in the app (Chrome DevTools for Android)

### Build errors in Android Studio
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run cap:sync
```

### Build errors in Xcode
```bash
# Clean derived data
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData
pod install
cd ..
npm run cap:sync
```

### Features don't work
- Authentication issues? Check CORS settings on your server
- Database errors? Ensure your production database is configured
- API calls failing? Verify all environment variables are set on server

## Environment Variables

Make sure these are set on your deployed server:

```env
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-app.vercel.app
# ... other env vars
```

## Next Steps

1. ✅ Deploy Next.js app
2. ✅ Configure capacitor.config.ts with server URL
3. ✅ Run `npm run cap:sync`
4. ✅ Test in Android Studio / Xcode
5. ✅ Deploy to app stores

## Learn More

- See `CAPACITOR_SETUP.md` for detailed architecture information
- See `README.md` for general project documentation
