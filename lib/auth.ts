import { z } from "zod";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "@auth/core";
import type { JWT } from "@auth/core/jwt";
import type { Session } from "@auth/core/types";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
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
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ 
            email: z.string().email(), 
            password: z.string().min(6) 
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        return {
          id: "1",
          name: "User",
          email: parsedCredentials.data.email,
          role: "USER"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: any }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    }
  }
} satisfies NextAuthConfig;