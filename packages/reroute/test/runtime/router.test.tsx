import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Link,
  Outlet,
  RouterProvider,
  createReactRouter,
  defineRoutes,
  useNavigate,
  useParams,
} from "../../src";

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve: resolve as (value: T) => void };
}

afterEach(() => {
  cleanup();
});

describe("router runtime", () => {
  it("matches nested routes and resolves async route nodes", async () => {
    const userResolve = vi.fn(
      async ({ params }: { params: Record<string, string> }) => ({
        id: params.id,
        name: "Ada",
      }),
    );

    const routes = defineRoutes([
      {
        path: "",
        resolve: () => (
          <div>
            <h1>Root</h1>
            <Outlet />
          </div>
        ),
        children: [
          {
            path: "users/:id",
            resolve: async ({ params }) => {
              const user = await userResolve({ params } as {
                params: Record<string, string>;
              });
              return (
                <UserDetails user={user as { id: string; name: string }} />
              );
            },
          },
        ],
      },
    ] as const);

    function UserDetails({ user }: { user: { id: string; name: string } }) {
      return (
        <div>
          <p data-testid="user-id">{user.id}</p>
        </div>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/users/42" />);

    await waitFor(() => {
      expect(screen.getByTestId("user-id").textContent).toBe("42");
    });

    expect(userResolve).toHaveBeenCalledTimes(1);
  });

  it("navigates with Link and keeps parent render stable", async () => {
    const parentRender = vi.fn(() => (
      <div>
        <span>Layout</span>
        <Outlet />
      </div>
    ));

    const routes = defineRoutes([
      {
        path: "",
        resolve: parentRender,
        children: [
          {
            path: "users/:id",
            resolve: () => <UserPage />,
          },
        ],
      },
    ] as const);

    function UserPage() {
      const params = useParams<{ id: string }>();
      return (
        <div>
          <p data-testid="id">{params.id}</p>
          <Link<typeof routes, "/users/:id">
            to="/users/:id"
            params={{ id: "2" }}
          >
            Next
          </Link>
        </div>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/users/1" />);

    await waitFor(() => {
      expect(screen.getByTestId("id").textContent).toBe("1");
    });
    const initialParentResolveCount = parentRender.mock.calls.length;

    fireEvent.click(screen.getByText("Next"));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByTestId("id").textContent).toBe("2");
    });

    expect(parentRender.mock.calls.length).toBe(initialParentResolveCount);
  });

  it("supports useNavigate", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "a",
            resolve: () => <NavigateButton />,
          },
          {
            path: "b/:slug",
            resolve: () => <SlugPage />,
          },
        ],
      },
    ] as const);

    function SlugPage() {
      const params = useParams<{ slug: string }>();
      return <p data-testid="slug">{params.slug}</p>;
    }

    function NavigateButton() {
      const navigate = useNavigate<typeof routes>();

      return (
        <button
          type="button"
          onClick={() => navigate("/b/:slug", { params: { slug: "target" } })}
        >
          Go
        </button>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/a" />);

    await waitFor(() => {
      expect(screen.getByText("Go")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Go"));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByTestId("slug").textContent).toBe("target");
    });
  });

  it("does not intercept modified or prevented link clicks", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "users/:id",
            resolve: () => <GuardedLinkPage />,
          },
        ],
      },
    ] as const);

    function GuardedLinkPage() {
      const params = useParams<{ id: string }>();
      return (
        <div>
          <p data-testid="id">{params.id}</p>
          <Link<typeof routes, "/users/:id">
            to="/users/:id"
            params={{ id: "2" }}
          >
            Modified click
          </Link>
          <Link<typeof routes, "/users/:id">
            to="/users/:id"
            params={{ id: "3" }}
            onClick={(event) => event.preventDefault()}
          >
            Prevented click
          </Link>
        </div>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/users/1" />);

    await waitFor(() => {
      expect(screen.getByTestId("id").textContent).toBe("1");
    });

    fireEvent.click(screen.getByText("Modified click"), { button: 1 });
    await flushPromises();
    expect(screen.getByTestId("id").textContent).toBe("1");

    fireEvent.click(screen.getByText("Prevented click"));
    await flushPromises();
    expect(screen.getByTestId("id").textContent).toBe("1");
  });

  it("ignores stale resolve completions after rapid navigation", async () => {
    const deferredMap = new Map<string, Deferred<{ id: string }>>();

    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "start",
            resolve: () => <StartPage />,
          },
          {
            path: "data/:id",
            resolve: ({ params }) => {
              const deferred = createDeferred<{ id: string }>();
              deferredMap.set(params.id, deferred);
              return deferred.promise.then((data) => (
                <p data-testid="loaded-id">{data.id}</p>
              ));
            },
          },
        ],
      },
    ] as const);

    function StartPage() {
      const navigate = useNavigate<typeof routes>();
      return (
        <div>
          <button
            type="button"
            onClick={() => navigate("/data/:id", { params: { id: "1" } })}
          >
            Load 1
          </button>
          <button
            type="button"
            onClick={() => navigate("/data/:id", { params: { id: "2" } })}
          >
            Load 2
          </button>
        </div>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/start" />);

    await waitFor(() => {
      expect(screen.getByText("Load 1")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Load 1"));
    fireEvent.click(screen.getByText("Load 2"));

    deferredMap.get("2")?.resolve({ id: "2" });
    await flushPromises();
    await waitFor(() => {
      expect(screen.getByTestId("loaded-id").textContent).toBe("2");
    });

    deferredMap.get("1")?.resolve({ id: "1" });
    await flushPromises();
    expect(screen.getByTestId("loaded-id").textContent).toBe("2");
  });

  it("ignores stale resolve completions after router prop swap", async () => {
    const deferred = createDeferred<{ id: string }>();

    const routesA = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "data",
            resolve: () =>
              deferred.promise.then((data) => (
                <p data-testid="value">{data.id}</p>
              )),
          },
        ],
      },
    ] as const);

    const routesB = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "data",
            resolve: () => <p data-testid="value">new-router</p>,
          },
        ],
      },
    ] as const);

    const routerA = createReactRouter(routesA);
    const routerB = createReactRouter(routesB);
    const rendered = render(
      <RouterProvider router={routerA} initialPath="/data" />,
    );

    rendered.rerender(<RouterProvider router={routerB} initialPath="/data" />);

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("new-router");
    });

    deferred.resolve({ id: "old-resolve" });
    await flushPromises();
    expect(screen.getByTestId("value").textContent).toBe("new-router");
  });

  it("matches optional params with backtracking", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: ":first?/:second",
            resolve: () => <OptionalParamsPage />,
          },
        ],
      },
    ] as const);

    function OptionalParamsPage() {
      const params = useParams<{ first?: string; second: string }>();
      return (
        <>
          <p data-testid="first">{params.first ?? ""}</p>
          <p data-testid="second">{params.second}</p>
        </>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/only-second" />);

    await waitFor(() => {
      expect(screen.getByTestId("first").textContent).toBe("");
      expect(screen.getByTestId("second").textContent).toBe("only-second");
    });
  });

  it("updates when initialPath prop changes", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          { path: "a", resolve: () => <p data-testid="path-value">a</p> },
          { path: "b", resolve: () => <p data-testid="path-value">b</p> },
        ],
      },
    ] as const);

    const router = createReactRouter(routes);
    const rendered = render(
      <RouterProvider router={router} initialPath="/a" />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("path-value").textContent).toBe("a");
    });

    rendered.rerender(<RouterProvider router={router} initialPath="/b" />);

    await waitFor(() => {
      expect(screen.getByTestId("path-value").textContent).toBe("b");
    });
  });

  it("passes search to navigation and resolve", async () => {
    const searchCalls: string[] = [];
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "from",
            resolve: () => <SearchNavigatePage />,
          },
          {
            path: "to",
            resolve: ({ location }) => {
              searchCalls.push(location.search);
              return <p data-testid="search-value">{location.search}</p>;
            },
          },
        ],
      },
    ] as const);

    function SearchNavigatePage() {
      const navigate = useNavigate<typeof routes>();
      return (
        <button
          type="button"
          onClick={() => navigate("/to", { search: { q: "abc" } })}
        >
          Navigate with search
        </button>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/from" />);

    await waitFor(() => {
      expect(screen.getByText("Navigate with search")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Navigate with search"));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByTestId("search-value").textContent).toBe("?q=abc");
    });
    expect(searchCalls).toContain("?q=abc");
  });

  it("reruns resolve for query-only navigation", async () => {
    const searchCalls: string[] = [];
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "search",
            resolve: ({ location }) => {
              searchCalls.push(location.search);
              return <SearchPage search={location.search} />;
            },
          },
        ],
      },
    ] as const);

    function SearchPage({ search }: { search: string }) {
      const navigate = useNavigate<typeof routes>();
      return (
        <div>
          <p data-testid="loaded-search">{search}</p>
          <button
            type="button"
            onClick={() => navigate("/search", { search: { q: "two" } })}
          >
            Update search
          </button>
        </div>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/search?q=one" />);

    await waitFor(() => {
      expect(screen.getByTestId("loaded-search").textContent).toBe("?q=one");
    });

    fireEvent.click(screen.getByText("Update search"));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByTestId("loaded-search").textContent).toBe("?q=two");
    });
    expect(searchCalls).toEqual(["?q=one", "?q=two"]);
  });

  it("syncs browser URL and supports replace navigation", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "a",
            resolve: () => <NavigateWithReplacePage />,
          },
          {
            path: "b",
            resolve: () => <p data-testid="page">b</p>,
          },
          {
            path: "c",
            resolve: () => <p data-testid="page">c</p>,
          },
        ],
      },
    ] as const);

    function NavigateWithReplacePage() {
      const navigate = useNavigate<typeof routes>();
      return (
        <div>
          <button type="button" onClick={() => navigate("/b")}>
            Push b
          </button>
          <button
            type="button"
            onClick={() => navigate("/c", { replace: true })}
          >
            Replace c
          </button>
          <Link<typeof routes, "/b"> to="/b" replace>
            Link replace b
          </Link>
        </div>
      );
    }

    window.history.replaceState(null, "", "/a");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const router = createReactRouter(routes);
    const rendered = render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Push b")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Push b"));
    await waitFor(() => {
      expect(screen.getByTestId("page").textContent).toBe("b");
    });
    expect(window.location.pathname).toBe("/b");
    expect(pushStateSpy).toHaveBeenCalled();

    window.history.replaceState(null, "", "/a");
    rendered.rerender(<RouterProvider router={router} initialPath="/a" />);
    await waitFor(() => {
      expect(screen.getByText("Replace c")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Replace c"));
    await waitFor(() => {
      expect(screen.getByTestId("page").textContent).toBe("c");
    });
    expect(window.location.pathname).toBe("/c");
    expect(replaceStateSpy).toHaveBeenCalled();

    window.history.pushState(null, "", "/a");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => {
      expect(screen.getByText("Link replace b")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Link replace b"));
    await waitFor(() => {
      expect(screen.getByTestId("page").textContent).toBe("b");
    });
    expect(window.location.pathname).toBe("/b");
  });

  it("renders notFound for unmatched routes", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "known",
            resolve: () => <p data-testid="known">known</p>,
          },
        ],
      },
    ] as const);

    const router = createReactRouter(routes);
    render(
      <RouterProvider
        router={router}
        initialPath="/missing?from=test"
        notFound={(location) => (
          <p data-testid="not-found">{location.pathname + location.search}</p>
        )}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("not-found").textContent).toBe(
        "/missing?from=test",
      );
    });
  });

  it("renders errorBoundary for resolve errors and can retry", async () => {
    let shouldFail = true;
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "boom",
            resolve: async () => {
              if (shouldFail) {
                throw new Error("boom");
              }
              return <p data-testid="resolved">ok</p>;
            },
          },
        ],
      },
    ] as const);

    const router = createReactRouter(routes);
    render(
      <RouterProvider
        router={router}
        initialPath="/boom"
        errorBoundary={({ error, retry }) => (
          <div>
            <p data-testid="error-message">
              {String((error as Error).message)}
            </p>
            <button
              type="button"
              onClick={() => {
                shouldFail = false;
                retry();
              }}
            >
              Retry
            </button>
          </div>
        )}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-message").textContent).toBe("boom");
    });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(screen.getByTestId("resolved").textContent).toBe("ok");
    });
  });

  it("updates browser URL even when navigation resolve fails", async () => {
    const routes = defineRoutes([
      {
        path: "",
        resolve: () => <Outlet />,
        children: [
          {
            path: "start",
            resolve: () => <NavigateToFailPage />,
          },
          {
            path: "boom",
            resolve: async () => {
              throw new Error("boom");
            },
          },
        ],
      },
    ] as const);

    function NavigateToFailPage() {
      const navigate = useNavigate<typeof routes>();
      return (
        <button type="button" onClick={() => navigate("/boom")}>
          Go boom
        </button>
      );
    }

    window.history.replaceState(null, "", "/start");
    const router = createReactRouter(routes);
    render(
      <RouterProvider
        router={router}
        errorBoundary={({ error }) => (
          <p data-testid="error-message">{String((error as Error).message)}</p>
        )}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Go boom")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Go boom"));

    await waitFor(() => {
      expect(screen.getByTestId("error-message").textContent).toBe("boom");
    });
    expect(window.location.pathname).toBe("/boom");
  });
});
