import { randomUUID } from "crypto";
import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { DataAccessLayer } from "../../../../data/dal";
import { Review, ReviewStatus } from "../../../../data/reviews/Review";
import { createTestApp } from "../../../../test-util/app";
import { sampleUser } from "../../../../test-util/sampleUser";

describe("reviews.list", () => {
  const validate = jest.spyOn(jwt, "validateToken");
  let list: any;
  let app: any;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
    list = jest.spyOn(dal.reviewService, "list");
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);

    list.mockImplementation(async () => {
      const reviewA = new Review(
        randomUUID(),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      reviewA.modelId = "id1";
      const reviewB = new Review(
        randomUUID(),
        "some-user",
        ReviewStatus.Requested,
        "some-reviewer"
      );
      reviewB.modelId = "id2";
      return { total: 2, items: [reviewA, reviewB] };
    });
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/reviews");
    expect(res.status).toBe(401);
  });

  it("should return 200 with no query parameter", async () => {
    const res = await request(app)
      .get("/api/v1/reviews")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
  });

  it("should return 500 when list() returns unknown error", async () => {
    list.mockImplementation(() => {
      const error = new Error("Something messed up");
      error.name = "Some other error";
      throw error;
    });

    const res = await request(app)
      .get("/api/v1/reviews?reviewed-by=some-reviewer")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(500);
  });

  it("should return 200 with for reviewed-by", async () => {
    const res = await request(app)
      .get("/api/v1/reviews?reviewed-by=some-reviewer")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.items[0].modelId).toBe("id1");
    expect(res.body.items[1].modelId).toBe("id2");
  });

  afterAll(() => {
    validate.mockRestore();
    list.mockRestore();
  });
});