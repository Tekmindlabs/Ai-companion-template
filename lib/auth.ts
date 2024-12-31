import { z } from "zod";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, Account, Profile } from "next-auth";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";

// Define the credentials schema
const credentialsSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(6) 
});

// Define custom user type
type CustomUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
};

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) return null;

        // Here you would typically:
        // 1. Verify the credentials against your database
        // 2. Hash and compare passwords
        // 3. Return the user if valid

        // Mock user for demonstration
        const user: CustomUser = {
          id: "1",
          name: "User",
          email: parsedCredentials.data.email,
          role: "USER",
        };

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ 
      token, 
      user 
    }) {
      if (user) {
        token.role = (user as CustomUser).role;
      }
      return token;
    },
    async session({ 
      session, 
      token 
    }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    }
  }
};

// Type declarations
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      email?: string | null;
      name?: string | null;
    }
  }

  interface User extends CustomUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
  }
}