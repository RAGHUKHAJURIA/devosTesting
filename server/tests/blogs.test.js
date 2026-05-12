const request = require("supertest");
const app = require("../app");

describe("Blogs API", () => {

  test("GET /api/blogs should respond", async () => {

    const response = await request(app).get("/api/blogs");

    expect(response.statusCode).toBeLessThan(500);

  });

});