import { describe, expect, it } from "vitest";
import {
  createClientEntry,
  createRSCEntry,
  createSSREntry,
  createRouter,
  getRouteBranchRoot,
  matchPathBranch,
  matchRoutePattern,
  path,
} from "../../src";

describe("route utilities", () => {
  it("matches path params and decodes values", () => {
    expect(matchRoutePattern("/users/m%C3%A4rti", "/users/:id")).toEqual({
      id: "märti",
    });
  });
});

describe("entry factories", () => {
  it("createRSCEntry redirects and keeps the right status", async () => {
    const handler = createRSCEntry({
      renderApp: async () => ({
        page: "hello",
        redirectTo: "/next",
        statusCode: 302,
      }),
      renderToReadableStream: (payload) =>
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(String(payload)));
            controller.close();
          },
        }),
    });

    const response = await handler(new Request("http://localhost/users"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/next");
  });

  it("createSSREntry hydrates the server stream with bootstrap modules", async () => {
    const handleSsr = createSSREntry({
      createFromReadableStream: async () => "root",
      renderToReadableStream: (root) =>
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(String(root)));
            controller.close();
          },
        }),
      getClientEntryUrl: () => "/entry-client.tsx",
    });

    const stream = await handleSsr(new ReadableStream());
    const html = await new Response(stream).text();

    expect(html).toContain("root");
  });

  it("createRSCEntry treats a root query parameter as a partial request", async () => {
    const handler = createRSCEntry({
      renderApp: async () => ({ page: "partial-root" }),
      renderToReadableStream: (payload) =>
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(String(payload)));
            controller.close();
          },
        }),
      createDocument: ({ page }) => `document:${page}`,
    });

    const response = await handler(
      new Request("http://localhost/users.rsc?root=%2Fusers"),
    );
    const text = await response.text();

    expect(text).toBe("partial-root");
  });

  it("getRouteBranchRoot keeps the shared ancestor between current and target paths", () => {
    expect(getRouteBranchRoot("/users/3", "/users/2")).toBe("/users");
    expect(getRouteBranchRoot("/users/3", "/users/3")).toBe("/users/3");
    expect(getRouteBranchRoot("/settings", "/users/2")).toBe("/");
  });

  it("matchPathBranch returns only the route subtree for the supplied root", () => {
    const router = createRouter({
      routes: [path("/users", () => "users", [path(":id", () => "id")])],
    });

    const matches = matchPathBranch(
      router.compiledRoutes,
      "/users/42",
      "/users",
    );

    expect(matches?.map(({ route }) => route.fullPath)).toEqual([
      "/users",
      "/users/:id",
    ]);
  });

  it("createClientEntry fetches the initial .rsc document without a partial root flag", async () => {
    let hydrated = false;
    let requestedUrl = "";
    const originalLocation = window.location.href;
    const originalFetch = globalThis.fetch;

    window.history.pushState({}, "", "/users/2?tab=all");
    globalThis.fetch = async (input: string | URL | Request) => {
      requestedUrl = String(input);
      return new Response(new Blob(["page"]));
    };

    const start = createClientEntry({
      createFromReadableStream: async () => "hydrated-root",
      hydrateRoot: () => {
        hydrated = true;
      },
    });

    await start();

    const requestUrl = new URL(requestedUrl);
    expect(requestUrl.pathname).toBe("/users/2.rsc");
    expect(requestUrl.searchParams.get("tab")).toBe("all");
    expect(requestUrl.searchParams.get("root")).toBeNull();
    expect(hydrated).toBe(true);

    globalThis.fetch = originalFetch;
    window.history.pushState({}, "", originalLocation);
  });
});
