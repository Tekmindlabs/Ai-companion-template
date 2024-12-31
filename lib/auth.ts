import { z } from "zod";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, Session, User } from "@auth/core/types";
import { JWT } from "@auth/core/jwt";
import CredentialsProvider from "@auth/core/providers/credentials";
import { db } from "@/lib/db";

const credentialsSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(6) 
});

type CustomUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
};

export const authConfig: AuthConfig = {
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
      async authorize(credentials: Partial<Record<"email" | "password", unknown>>, req: Request) {
        if (!credentials?.email || !credentials?.password) return null;

        const parsedCredentials = credentialsSchema.safeParse({
          email: credentials.email as string,
          password: credentials.password as string
        });

        if (!parsedCredentials.success) return null;

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
      user,
    }) {
      if (user) {
        token.role = (user as CustomUser).role;
      }
      return token;
    },
    async session({ 
      session, 
      token 
    }: { 
      session: DefaultSession; 
      token: JWT;
    }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    }
  }
};

declare module "@auth/core" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      email?: string | null;
      name?: string | null;
    } & DefaultSession["user"]
  }

  interface User extends CustomUser {}
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
  }
}