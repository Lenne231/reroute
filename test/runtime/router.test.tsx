import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Link,
  Outlet,
  RouterProvider,
  createReactRouter,
  defineRoutes,
  useNavigate,
  useOutletContext,
  useParams
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
  it("matches nested routes and runs loaders", async () => {
    const userLoader = vi.fn(async ({ params }: { params: Record<string, string> }) => ({
      id: params.id,
      name: "Ada"
    }));

    const routes = defineRoutes([
      {
        path: "",
        render: () => (
          <div>
            <h1>Root</h1>
            <Outlet context={{ fromRoot: true }} />
          </div>
        ),
        children: [
          {
            path: "users/:id",
            loader: userLoader,
            render: ({ loaderData }) => <UserDetails user={loaderData as { id: string; name: string }} />
          }
        ]
      }
    ] as const);

    function UserDetails({ user }: { user: { id: string; name: string } }) {
      const parent = useOutletContext<{ fromRoot: boolean }>();
      return (
        <div>
          <p data-testid="user-id">{user.id}</p>
          <p data-testid="root-context">{String(parent.fromRoot)}</p>
        </div>
      );
    }

    const router = createReactRouter(routes);
    render(<RouterProvider router={router} initialPath="/users/42" />);

    await waitFor(() => {
      expect(screen.getByTestId("user-id").textContent).toBe("42");
    });

    expect(screen.getByTestId("root-context").textContent).toBe("true");
    expect(userLoader).toHaveBeenCalledTimes(1);
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
        render: parentRender,
        children: [
          {
            path: "users/:id",
            render: () => <UserPage />
          }
        ]
      }
    ] as const);

    function UserPage() {
      const params = useParams<{ id: string }>();
      return (
        <div>
          <p data-testid="id">{params.id}</p>
          <Link<typeof routes, "/users/:id"> to="/users/:id" params={{ id: "2" }}>
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

    fireEvent.click(screen.getByText("Next"));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByTestId("id").textContent).toBe("2");
    });

    expect(parentRender).toHaveBeenCalledTimes(1);
  });

  it("supports useNavigate", async () => {
    const routes = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: "a",
            render: () => <NavigateButton />
          },
          {
            path: "b/:slug",
            render: () => <SlugPage />
          }
        ]
      }
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
        render: () => <Outlet />,
        children: [
          {
            path: "users/:id",
            render: () => <GuardedLinkPage />
          }
        ]
      }
    ] as const);

    function GuardedLinkPage() {
      const params = useParams<{ id: string }>();
      return (
        <div>
          <p data-testid="id">{params.id}</p>
          <Link<typeof routes, "/users/:id"> to="/users/:id" params={{ id: "2" }}>
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

  it("ignores stale loader completions after rapid navigation", async () => {
    const deferredMap = new Map<string, Deferred<{ id: string }>>();

    const routes = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: "start",
            render: () => <StartPage />
          },
          {
            path: "data/:id",
            loader: ({ params }) => {
              const deferred = createDeferred<{ id: string }>();
              deferredMap.set(params.id, deferred);
              return deferred.promise;
            },
            render: ({ loaderData }) => <p data-testid="loaded-id">{(loaderData as { id: string }).id}</p>
          }
        ]
      }
    ] as const);

    function StartPage() {
      const navigate = useNavigate<typeof routes>();
      return (
        <div>
          <button type="button" onClick={() => navigate("/data/:id", { params: { id: "1" } })}>
            Load 1
          </button>
          <button type="button" onClick={() => navigate("/data/:id", { params: { id: "2" } })}>
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

  it("ignores stale loader completions after router prop swap", async () => {
    const deferred = createDeferred<{ id: string }>();

    const routesA = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: "data",
            loader: () => deferred.promise,
            render: ({ loaderData }) => <p data-testid="value">{(loaderData as { id: string }).id}</p>
          }
        ]
      }
    ] as const);

    const routesB = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: "data",
            render: () => <p data-testid="value">new-router</p>
          }
        ]
      }
    ] as const);

    const routerA = createReactRouter(routesA);
    const routerB = createReactRouter(routesB);
    const rendered = render(<RouterProvider router={routerA} initialPath="/data" />);

    rendered.rerender(<RouterProvider router={routerB} initialPath="/data" />);

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("new-router");
    });

    deferred.resolve({ id: "old-loader" });
    await flushPromises();
    expect(screen.getByTestId("value").textContent).toBe("new-router");
  });

  it("matches optional params with backtracking", async () => {
    const routes = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: ":first?/:second",
            render: () => <OptionalParamsPage />
          }
        ]
      }
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
        render: () => <Outlet />,
        children: [
          { path: "a", render: () => <p data-testid="path-value">a</p> },
          { path: "b", render: () => <p data-testid="path-value">b</p> }
        ]
      }
    ] as const);

    const router = createReactRouter(routes);
    const rendered = render(<RouterProvider router={router} initialPath="/a" />);

    await waitFor(() => {
      expect(screen.getByTestId("path-value").textContent).toBe("a");
    });

    rendered.rerender(<RouterProvider router={router} initialPath="/b" />);

    await waitFor(() => {
      expect(screen.getByTestId("path-value").textContent).toBe("b");
    });
  });

  it("passes search to navigation and loaders", async () => {
    const loaderCalls: string[] = [];
    const routes = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: "from",
            render: () => <SearchNavigatePage />
          },
          {
            path: "to",
            loader: ({ location }) => {
              loaderCalls.push(location.search);
              return { search: location.search };
            },
            render: ({ loaderData }) => <p data-testid="search-value">{(loaderData as { search: string }).search}</p>
          }
        ]
      }
    ] as const);

    function SearchNavigatePage() {
      const navigate = useNavigate<typeof routes>();
      return (
        <button type="button" onClick={() => navigate("/to", { search: { q: "abc" } })}>
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
    expect(loaderCalls).toContain("?q=abc");
  });

  it("reruns loader for query-only navigation", async () => {
    const loaderCalls: string[] = [];
    const routes = defineRoutes([
      {
        path: "",
        render: () => <Outlet />,
        children: [
          {
            path: "search",
            loader: ({ location }) => {
              loaderCalls.push(location.search);
              return { search: location.search };
            },
            render: ({ loaderData }) => <SearchPage search={loaderData as { search: string }} />
          }
        ]
      }
    ] as const);

    function SearchPage({ search }: { search: { search: string } }) {
      const navigate = useNavigate<typeof routes>();
      return (
        <div>
          <p data-testid="loaded-search">{search.search}</p>
          <button type="button" onClick={() => navigate("/search", { search: { q: "two" } })}>
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
    expect(loaderCalls).toEqual(["?q=one", "?q=two"]);
  });
});
