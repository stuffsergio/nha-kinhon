import { describe, it, expect } from "vitest";
import { resolveOsrmBase } from "../../../utils/osrmUrl.js";

describe("resolveOsrmBase SSRF guards", () => {
  it("uses public default when production blocks localhost", () => {
    expect(resolveOsrmBase("http://127.0.0.1:5000", true)).toBe(
      "https://router.project-osrm.org",
    );
  });

  it("allows custom https host in production", () => {
    expect(resolveOsrmBase("https://osrm.example.com/", true)).toBe("https://osrm.example.com");
  });

  it("allows localhost in non-production", () => {
    expect(resolveOsrmBase("http://127.0.0.1:5000", false)).toBe("http://127.0.0.1:5000");
  });
});
