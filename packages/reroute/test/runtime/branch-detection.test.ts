import { describe, expect, it } from "vitest";
import { isUsersRoutePath } from "../../../example/src/routeState";

describe("isUsersRoutePath", () => {
  it("recognizes the users area based on the actual pathname", () => {
    expect(isUsersRoutePath("/users")).toBe(true);
    expect(isUsersRoutePath("/users/create")).toBe(true);
    expect(isUsersRoutePath("/users/42")).toBe(true);
  });

  it("ignores other routes", () => {
    expect(isUsersRoutePath("/")).toBe(false);
    expect(isUsersRoutePath("/settings")).toBe(false);
    expect(isUsersRoutePath("/settings/account")).toBe(false);
  });
});
