import {
  RoutePaths,
  defineRoute,
  defineRoutes,
  index,
  layout,
  path,
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

type Paths = RoutePaths<typeof routes>;
const pathA: Paths = "/users/:id";
const pathB: Paths = "/about";
const pathC: Paths = "/posts/:slug?";

void pathA;
void pathB;
void pathC;
