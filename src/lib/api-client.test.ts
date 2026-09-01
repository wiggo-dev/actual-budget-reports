import { describe, expect, it } from "vitest";

import { parseJsonResponse } from "@/lib/api-client";

describe("parseJsonResponse", () => {
  it("rejects empty bodies with a clear error", async () => {
    const response = new Response("", {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(parseJsonResponse(response)).rejects.toThrow(
      "Empty response from API (500)"
    );
  });
});
