/**
 * Unit tests for readJsonFromLocalStorage
 */

import { beforeEach, describe, expect, it } from "vitest";
import { readJsonFromLocalStorage } from "../utils/readJsonFromLocalStorage";

describe("readJsonFromLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the fallback when the key is absent", () => {
    expect(readJsonFromLocalStorage("projects", ["default"])).toEqual([
      "default",
    ]);
  });

  it("returns the parsed value when the key holds valid JSON", () => {
    localStorage.setItem("projects", JSON.stringify(["default", "review"]));
    expect(readJsonFromLocalStorage("projects", ["default"])).toEqual([
      "default",
      "review",
    ]);
  });

  // The exact values the E2E "malformed localStorage data" case writes.
  it("returns the fallback when the key holds text that is not JSON", () => {
    localStorage.setItem("projects", "invalid json");
    localStorage.setItem("proj:default:highlights", "not valid json");

    expect(readJsonFromLocalStorage("projects", ["default"])).toEqual([
      "default",
    ]);
    expect(readJsonFromLocalStorage("proj:default:highlights", [])).toEqual([]);
  });

  it("returns an empty-string value as the fallback rather than throwing", () => {
    localStorage.setItem("proj:default:pageForm", "");
    expect(readJsonFromLocalStorage("proj:default:pageForm", {})).toEqual({});
  });

  it("returns the fallback when the key holds a bare null", () => {
    localStorage.setItem("proj:default:pageForm", "null");
    expect(readJsonFromLocalStorage("proj:default:pageForm", {})).toEqual({});
  });
});
