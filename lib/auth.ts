import { z } from "zod";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthConfig, User as AuthUser } from "@auth/core";
import type { JWT } from "@auth/core/jwt";
import type { Session } from "@auth/core/types";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import type { 
  Account, 
  Profile, 
  User,
  AdapterUser 
} from "next-auth";

// Define the credentials schema
const credentialsSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(6) 
});

export const authConfig = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(
        credentials: Record<"email" | "password", string> | undefined,
        req: Pick<Request, "body" | "query" | "headers" | "method">
      ): Promise<User | null> {
        if (!credentials) return null;

        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) return null;

        // Here you would typically:
        // 1. Verify the credentials against your database
        // 2. Hash and compare passwords
        // 3. Return the user if valid

        // Mock user for demonstration
        const user: User = {
          id: "1",
          name: "User",
          email: parsedCredentials.data.email,
          role: "USER" as const,
        };

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ 
      token, 
      user, 
      account, 
      profile, 
      trigger 
    }: {
      token: JWT;
      user?: User | AdapterUser | null;
      account?: Account | null;
      profile?: Profile;
      trigger?: "signIn" | "signUp" | "update";
    }) {
      if (user) {
        token.role = (user as User).role;
      }
      return token;
    },
    async session({ 
      session, 
      token, 
      user 
    }: { 
      session: Session; 
      token: JWT;
      user: AdapterUser | User;
    }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    }
  }
} satisfies AuthConfig;

// Type declaration to ensure type safety
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      email?: string | null;
      name?: string | null;
    }
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role: "USER" | "ADMIN";
  }
}

// Type declaration for JWT
declare module "@auth/core/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
  }
}