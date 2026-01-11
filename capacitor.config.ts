// Local copy of the Capacitor configuration shape to avoid requiring @capacitor/cli
// in environments where native tooling is not installed yet.
type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime: boolean;
};

const config: CapacitorConfig = {
  appId: "com.zzphub.app",
  appName: "ZZP HUB",
  webDir: "out",
  bundledWebRuntime: false,
};

export default config;
