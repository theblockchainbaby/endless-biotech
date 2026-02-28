import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: string;
      organizationId: string;
      organizationName: string;
    };
  }

  interface User {
    role?: string;
    organizationId?: string;
    organizationName?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    organizationId?: string;
    organizationName?: string;
  }
}
