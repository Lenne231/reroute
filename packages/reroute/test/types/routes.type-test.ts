import {
  LinkProps,
  RoutePaths,
  createReactRouter,
  defineRoute,
  defineRoutes,
  index,
  layout,
  path,
  useNavigate,
} from "../../src";

const inferredRoutes = defineRoutes([
  defineRoute({
    path: "products/:productId",
    resolve: ({ params }) => {
      const productId: string = params.productId;
      // @ts-expect-error invalid inferred param key
      const invalid = params.unknown;
      void invalid;
      return `Product ${productId}`;
    },
    children: [
      defineRoute({
        path: "reviews/:reviewId?",
        resolve: ({ params }) => {
          const reviewId: string | undefined = params.reviewId;
          const optionalReviewId: string | undefined = params.reviewId;
          return `${optionalReviewId ?? "none"}-${reviewId ?? "none"}`;
        },
      }),
    ],
  }),
] as const);

void inferredRoutes;

const helperRoutes = defineRoutes([
  layout(
    () => null,
    [
      index(({ params }) => {
        const keys = Object.keys(params);
        const count: number = keys.length;
        return String(count);
      }),
      path("teams/:teamId", ({ params }) => {
        const teamId: string = params.teamId;
        // @ts-expect-error invalid inferred param key
        const invalid = params.missing;
        void invalid;
        return teamId;
      }),
    ],
  ),
] as const);

void helperRoutes;

const routes = defineRoutes([
  {
    path: "",
    resolve: () => null,
    children: [
      {
        path: "users/:id",
        resolve: () => null,
      },
      {
        path: "about",
        resolve: () => null,
      },
      {
        path: "posts/:slug?",
        resolve: () => null,
      },
    ],
  },
] as const);

const router = createReactRouter(routes);

type Paths = RoutePaths<typeof router.routes>;
const pathA: Paths = "/users/:id";
const pathB: Paths = "/about";
const pathC: Paths = "/posts/:slug?";

const linkOk: LinkProps<typeof routes, "/users/:id"> = {
  to: pathA,
  params: { id: "123" },
};

const linkNoParams: LinkProps<typeof routes, "/about"> = {
  to: pathB,
};

const optionalParamsMissing: LinkProps<typeof routes, "/posts/:slug?"> = {
  to: pathC,
};

const optionalParamsProvided: LinkProps<typeof routes, "/posts/:slug?"> = {
  to: pathC,
  params: { slug: "hello" },
};

// @ts-expect-error required route params missing
const linkMissing: LinkProps<typeof routes, "/users/:id"> = {
  to: pathA,
};

const linkUnexpectedParams: LinkProps<typeof routes, "/about"> = {
  to: pathB,
  // @ts-expect-error params not allowed for route without params
  params: { id: "x" },
};

void linkOk;
void linkNoParams;
void optionalParamsMissing;
void optionalParamsProvided;
void linkMissing;
void linkUnexpectedParams;
void router;

type Navigate = ReturnType<typeof useNavigate<typeof routes>>;
const navigate = null as unknown as Navigate;

navigate<"/users/:id">("/users/:id", { params: { id: "abc" } });
navigate<"/about">("/about");
navigate<"/posts/:slug?">("/posts/:slug?");
navigate<"/posts/:slug?">("/posts/:slug?", { params: { slug: "post" } });

// @ts-expect-error required route params missing
navigate<"/users/:id">("/users/:id");
// @ts-expect-error params not allowed for static route
navigate<"/about">("/about", { params: { id: "x" } });
