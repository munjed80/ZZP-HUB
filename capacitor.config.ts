// Capacitor Configuration
// 
// IMPORTANT: This app requires a backend server to function.
// Static export mode won't work due to server actions, API routes, and middleware.
// 
// For development and production, uncomment the server configuration below
// and point it to your deployed Next.js application.

type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime: boolean;
  server?: {
    url?: string;
    cleartext?: boolean;
  };
};

const config: CapacitorConfig = {
  appId: "com.zzphub.app",
  appName: "ZZP HUB",
  webDir: "out",
  bundledWebRuntime: false,
  
  // RECOMMENDED: Point to your deployed Next.js server
  // Uncomment and configure for development/production:
  // 
  // server: {
  //   // Development: Point to local Next.js server
  //   url: process.env.NODE_ENV === 'development' 
  //     ? 'http://localhost:3000'
  //     : 'https://your-app.vercel.app',  // Your production URL
  //   
  //   // Allow HTTP in development (not recommended for production)
  //   cleartext: process.env.NODE_ENV === 'development'
  // }
};

export default config;
