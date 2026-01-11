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
