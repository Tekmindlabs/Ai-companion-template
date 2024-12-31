import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "USER" | "ADMIN";
  }
}