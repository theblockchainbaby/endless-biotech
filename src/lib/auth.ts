import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "./rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Note: PrismaAdapter removed — not needed with JWT + Credentials.
  // The adapter tries to create/delete DB sessions which conflicts with JWT strategy,
  // causing sign-out to silently fail and leaving stale cookies.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 10 login attempts per minute per email
        const { allowed } = rateLimit(`login:${credentials.email}`, { max: 10, windowMs: 60_000 });
        if (!allowed) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: credentials.email as string, mode: "insensitive" } },
          include: { organization: true },
        });

        if (!user || !user.passwordHash || !user.isActive || user.role === "disabled") return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date(), loginCount: { increment: 1 } },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        };
      },
    }),
    Credentials({
      id: "pin",
      name: "PIN Login",
      credentials: {
        pin: { label: "PIN", type: "text" },
        organizationId: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.pin || !credentials?.organizationId) return null;

        // Rate limit: 5 PIN attempts per minute per org
        const { allowed } = rateLimit(`pin:${credentials.organizationId}`, { max: 5, windowMs: 60_000 });
        if (!allowed) return null;

        const user = await prisma.user.findFirst({
          where: {
            pin: credentials.pin as string,
            organizationId: credentials.organizationId as string,
            isActive: true,
            NOT: { role: "disabled" },
          },
          include: { organization: true },
        });

        if (!user) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date(), loginCount: { increment: 1 } },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string;
        token.organizationId = (user as Record<string, unknown>).organizationId as string;
        token.organizationName = (user as Record<string, unknown>).organizationName as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.role = token.role;
        user.organizationId = token.organizationId;
        user.organizationName = token.organizationName;
      }
      return session;
    },
  },
});
