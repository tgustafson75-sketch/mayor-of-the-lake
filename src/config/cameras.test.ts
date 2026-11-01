import { describe, expect, it } from "vitest";
import { CAMERA_PRESETS, DEFAULT_CAMERA } from "./cameras";

describe("camera presets", () => {
  it("defines exactly the five presets from the addendum", () => {
    expect(CAMERA_PRESETS.map((p) => p.id)).toEqual(["city", "street", "lake", "planner", "free"]);
  });

  it("default is the city view", () => {
    expect(DEFAULT_CAMERA).toBe("city");
  });

  it("every preset has a usable field of view", () => {
    for (const p of CAMERA_PRESETS) {
      expect(p.fov).toBeGreaterThan(20);
      expect(p.fov).toBeLessThan(90);
    }
  });
});
