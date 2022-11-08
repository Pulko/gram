import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import * as dataSystems from "../../../../data/systems";
import { createTestApp } from "../../../../test-util/app";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import { sampleUser } from "../../../../test-util/sampleUser";

const validate = jest.spyOn(jwt, "validateToken");
const list = jest.spyOn(dataSystems, "list");

describe("systems.list", () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);

    list.mockImplementation(async () => {
      return { systems: [sampleOwnedSystem], total: 1 };
    });
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/systems");
    expect(res.status).toBe(401);
  });

  it("should return 400 with no filter query parameter", async () => {
    const res = await request(app)
      .get("/api/v1/systems")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(400);
  });

  it("should return 400 with invalid filter query parameter", async () => {
    const res = await request(app)
      .get("/api/v1/systems?filter=123")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(400);
  });

  it("should return 500 when list() returns unknown error", async () => {
    list.mockImplementation(async () => {
      const error = new Error("Something messed up");
      error.name = "Some other error";
      throw error;
    });

    const res = await request(app)
      .get("/api/v1/systems?filter=search")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(500);
  });

  it("should return 200 with dummy results", async () => {
    const res = await request(app)
      .get("/api/v1/systems?filter=search")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.systems[0]).toEqual(sampleOwnedSystem);
  });

  afterAll(() => {
    validate.mockRestore();
    list.mockRestore();
  });
});