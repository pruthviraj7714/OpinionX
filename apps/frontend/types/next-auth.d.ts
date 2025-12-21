import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    token?: string; 
    role : "USER" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role : "USER" | "ADMIN";
    } & DefaultSession["user"];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken?: string;
  }
}