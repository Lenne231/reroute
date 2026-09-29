import { describe, expect, it } from "vitest";
import {
  createClientEntry,
  createRSCEntry,
  createSSREntry,
  matchRoutePattern,
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

  it("createClientEntry fetches the .rsc page and hydrates it", async () => {
    let hydrated = false;
    const originalLocation = window.location.href;

    window.history.pushState({}, "", "/users?tab=all");

    const start = createClientEntry({
      fetchPage: () =>
        Promise.resolve(
          new Response(new Blob(["page"]))
        ),
      createFromReadableStream: async () => "hydrated-root",
      hydrateRoot: () => {
        hydrated = true;
      },
    });

    await start();

    expect(hydrated).toBe(true);
    window.history.pushState({}, "", originalLocation);
  });
});
