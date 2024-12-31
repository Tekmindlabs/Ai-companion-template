import { z } from "zod";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "@auth/core"
import { JWT } from "@auth/core/jwt"
import CredentialsProvider from "@auth/core/providers/credentials"
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
      async authorize(credentials: Record<"email" | "password", string> | undefined, req: Request) {
        if (!credentials) return null;

        const parsedCredentials = credentialsSchema.safeParse(credentials);

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
      account,
      profile 
    }: {
      token: JWT;
      user: CustomUser | null;
      account: any;
      profile?: any;
    }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ 
      session, 
      token 
    }: { 
      session: DefaultSession; 
      token: JWT;
    }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session as Session;
    }
  }
};

declare module "@auth/core" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      email?: string | null;
      name?: string | null;
    }
  }

  interface User extends CustomUser {}
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
  }
}