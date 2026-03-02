import { vi } from "vitest";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vessel: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    cultivar: {
      findMany: vi.fn(),
    },
    activity: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      vessel: {
        create: vi.fn(),
        update: vi.fn(),
      },
      activity: {
        create: vi.fn(),
      },
    })),
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
      organizationId: "test-org-id",
    },
  }),
}));

// Mock activity logger
vi.mock("@/lib/activity-logger", () => ({
  logActivity: vi.fn().mockResolvedValue({ id: "test-activity-id" }),
}));
