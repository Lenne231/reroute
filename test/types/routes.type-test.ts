import { LinkProps, RoutePaths, createReactRouter, defineRoute, defineRoutes, useNavigate } from "../../src";

const inferredRoutes = defineRoutes([
  defineRoute({
    path: "products/:productId",
    loader: ({ params }) => {
      const productId: string = params.productId;
      // @ts-expect-error invalid inferred param key
      const invalid = params.unknown;
      void invalid;
      return { productId, rating: 5 };
    },
    render: ({ params, loaderData }) => {
      const productId: string = params.productId;
      const fromLoader: string = loaderData.productId;
      const rating: number = loaderData.rating;
      // @ts-expect-error loader data shape is inferred from loader return type
      const invalid = loaderData.missing;
      void invalid;
      return `${productId}-${fromLoader}-${rating}`;
    },
    children: [
      defineRoute({
        path: "reviews/:reviewId?",
        loader: ({ params }) => {
          const reviewId: string | undefined = params.reviewId;
          return { reviewId };
        },
        render: ({ params, loaderData }) => {
          const optionalReviewId: string | undefined = params.reviewId;
          const fromLoader: string | undefined = loaderData.reviewId;
          return `${optionalReviewId ?? "none"}-${fromLoader ?? "none"}`;
        }
      })
    ]
  })
] as const);

void inferredRoutes;

const routes = defineRoutes([
  {
    path: "",
    render: () => null,
    children: [
      {
        path: "users/:id",
        render: () => null
      },
      {
        path: "about",
        render: () => null
      },
      {
        path: "posts/:slug?",
        render: () => null
      }
    ]
  }
] as const);

const router = createReactRouter(routes);

type Paths = RoutePaths<typeof router.routes>;
const pathA: Paths = "/users/:id";
const pathB: Paths = "/about";
const pathC: Paths = "/posts/:slug?";

const linkOk: LinkProps<typeof routes, "/users/:id"> = {
  to: pathA,
  params: { id: "123" }
};

const linkNoParams: LinkProps<typeof routes, "/about"> = {
  to: pathB
};

const optionalParamsMissing: LinkProps<typeof routes, "/posts/:slug?"> = {
  to: pathC
};

const optionalParamsProvided: LinkProps<typeof routes, "/posts/:slug?"> = {
  to: pathC,
  params: { slug: "hello" }
};

// @ts-expect-error required route params missing
const linkMissing: LinkProps<typeof routes, "/users/:id"> = {
  to: pathA
};

const linkUnexpectedParams: LinkProps<typeof routes, "/about"> = {
  to: pathB,
  // @ts-expect-error params not allowed for route without params
  params: { id: "x" }
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
