import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    token?: string; 
    username : string;
    role : "USER" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role : "USER" | "ADMIN";
      username : string;
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