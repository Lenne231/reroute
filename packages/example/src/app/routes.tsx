import { Suspense } from "react";
import { Outlet, defineRoutes, index, layout, useIsNavigating } from "reroute";
import { InitialLoadingScreen } from "./InitialLoadingScreen";
import { resolveHomeRoute } from "../features/home/home.route";
import { usersRoutes } from "../features/users/users.routes";

function NavigationSpinner() {
  const isNavigating = useIsNavigating();

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      aria-label="Loading"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "3px solid #d1d5db",
        borderTopColor: "#111827",
        animation: "reroute-spin 0.8s linear infinite",
      }}
    />
  );
}

function RootLayout({ message }: { message: string }) {
  return (
    <div>
      <style>
        {
          "@keyframes reroute-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .nav-link { color: #1d4ed8; text-decoration: none; } .nav-link:hover { text-decoration: underline; } .nav-link-active { color: #111827; font-weight: 700; } .nav-link-pending { opacity: 0.6; }"
        }
      </style>
      <NavigationSpinner />
      <p>{message}</p>
      <Outlet />
    </div>
  );
}

async function resolveRootLayout() {
  console.log("Resolve root layout");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const message = "Welcome to the reroute demo!";

  return <RootLayout message={message} />;
}

export const routes = defineRoutes([
  layout(resolveRootLayout, [index(resolveHomeRoute), usersRoutes]),
] as const);
