import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// We test the core business logic by calling the route handlers directly
// Import after mocks are set up in setup.ts

function makeRequest(body: unknown, method = "POST"): NextRequest {
  return new NextRequest("http://localhost:3000/api/vessels", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("Vessel Creation - Duplicate Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject duplicate barcodes", async () => {
    // Arrange: barcode already exists
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "existing-id",
      barcode: "TC0001",
      status: "planted",
    });

    const { POST } = await import("@/app/api/vessels/route");
    const req = makeRequest({
      barcode: "TC0001",
      explantCount: 5,
      healthStatus: "healthy",
      status: "planted",
      stage: "initiation",
    });

    // Act
    const res = await POST(req);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toContain("already exists");
  });

  it("should create vessel when barcode is unique", async () => {
    // Arrange: no existing vessel with this barcode
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (prisma.vessel.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "new-id",
      barcode: "TC9999",
      status: "planted",
      stage: "initiation",
      healthStatus: "healthy",
      explantCount: 5,
      organizationId: "test-org-id",
    });

    const { POST } = await import("@/app/api/vessels/route");
    const req = makeRequest({
      barcode: "TC9999",
      explantCount: 5,
      healthStatus: "healthy",
      status: "planted",
      stage: "initiation",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(201);
  });
});

describe("Vessel Stage Advancement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject advancing a disposed vessel", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      stage: "initiation",
      status: "disposed",
      organizationId: "test-org-id",
    });

    const { POST } = await import("@/app/api/vessels/[id]/advance-stage/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/advance-stage", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("disposed");
  });

  it("should reject advancing past final stage", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      stage: "hardening",
      status: "growing",
      organizationId: "test-org-id",
    });

    const { POST } = await import("@/app/api/vessels/[id]/advance-stage/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/advance-stage", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("final stage");
  });

  it("should advance from initiation to multiplication", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      stage: "initiation",
      status: "growing",
      organizationId: "test-org-id",
    });
    (prisma.vessel.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      stage: "multiplication",
      status: "growing",
    });

    const { POST } = await import("@/app/api/vessels/[id]/advance-stage/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/advance-stage", {
      method: "POST",
      body: JSON.stringify({ notes: "Ready for multiplication" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });

    expect(res.status).toBe(200);
  });
});

describe("Vessel Health Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject health check on disposed vessel", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      status: "disposed",
      healthStatus: "healthy",
      contaminationType: null,
      organizationId: "test-org-id",
    });

    const { POST } = await import("@/app/api/vessels/[id]/health-check/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/health-check", {
      method: "POST",
      body: JSON.stringify({ healthStatus: "critical" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("disposed");
  });

  it("should auto-dispose when marked dead", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      status: "growing",
      healthStatus: "healthy",
      contaminationType: null,
      contaminationDate: null,
      organizationId: "test-org-id",
    });
    (prisma.vessel.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      healthStatus: "dead",
      status: "disposed",
    });

    const { POST } = await import("@/app/api/vessels/[id]/health-check/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/health-check", {
      method: "POST",
      body: JSON.stringify({ healthStatus: "dead" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });

    expect(res.status).toBe(200);
    // Verify that the update was called with status: "disposed"
    expect(prisma.vessel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          healthStatus: "dead",
          status: "disposed",
        }),
      })
    );
  });
});

describe("Vessel Move", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject moving a disposed vessel", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      status: "disposed",
      location: null,
      organizationId: "test-org-id",
    });

    const { POST } = await import("@/app/api/vessels/[id]/move/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/move", {
      method: "POST",
      body: JSON.stringify({ locationId: "loc-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("disposed");
  });
});

describe("Multiply Vessel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject multiplying an already multiplied vessel", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      status: "multiplied",
      organizationId: "test-org-id",
      cultivarId: "c1",
      mediaRecipeId: null,
      locationId: null,
      subcultureNumber: 1,
      generation: 1,
    });

    const { POST } = await import("@/app/api/vessels/[id]/multiply/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/multiply", {
      method: "POST",
      body: JSON.stringify({
        children: [{ barcode: "TC0002", explantCount: 5 }],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("already been multiplied");
  });

  it("should reject duplicate child barcodes", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      status: "growing",
      organizationId: "test-org-id",
      cultivarId: "c1",
      mediaRecipeId: null,
      locationId: null,
      subcultureNumber: 1,
      generation: 1,
    });
    // Existing barcode found
    (prisma.vessel.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { barcode: "TC0002" },
    ]);

    const { POST } = await import("@/app/api/vessels/[id]/multiply/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/multiply", {
      method: "POST",
      body: JSON.stringify({
        children: [{ barcode: "TC0002", explantCount: 5 }],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toContain("TC0002");
  });
});

describe("Undo Last Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject undo when no reversible actions exist", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      organizationId: "test-org-id",
    });
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/vessels/[id]/undo/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("No reversible actions");
  });

  it("should reject undo after 30-minute window", async () => {
    (prisma.vessel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "v1",
      barcode: "TC0001",
      organizationId: "test-org-id",
    });
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "a1",
      type: "stage_advanced",
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      previousState: { stage: "initiation" },
    });

    const { POST } = await import("@/app/api/vessels/[id]/undo/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/v1/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({ id: "v1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("30 minutes");
  });
});

describe("CSV Import Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject CSV without barcode column", async () => {
    const { POST } = await import("@/app/api/vessels/import/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/import", {
      method: "POST",
      body: JSON.stringify({ csv: "name,stage\nTest,initiation" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("barcode");
  });

  it("should reject CSV with duplicate barcodes", async () => {
    const { POST } = await import("@/app/api/vessels/import/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/import", {
      method: "POST",
      body: JSON.stringify({
        csv: "barcode,stage\nTC001,initiation\nTC001,multiplication",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("duplicate");
  });

  it("should reject when barcodes already exist in database", async () => {
    (prisma.vessel.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { barcode: "TC001" },
    ]);

    const { POST } = await import("@/app/api/vessels/import/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/import", {
      method: "POST",
      body: JSON.stringify({
        csv: "barcode,stage\nTC001,initiation\nTC002,multiplication",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toContain("TC001");
  });

  it("should reject more than 500 vessels", async () => {
    const rows = Array.from({ length: 501 }, (_, i) => `TC${String(i).padStart(4, "0")},initiation`);
    const csv = `barcode,stage\n${rows.join("\n")}`;

    const { POST } = await import("@/app/api/vessels/import/route");
    const req = new NextRequest("http://localhost:3000/api/vessels/import", {
      method: "POST",
      body: JSON.stringify({ csv }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("500");
  });
});
