import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    isSuspended: boolean;
    emailVerified: boolean;
    onboardingCompleted: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      isSuspended: boolean;
      emailVerified: boolean;
      onboardingCompleted: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isSuspended: boolean;
    emailVerified: boolean;
    onboardingCompleted: boolean;
  }
}
