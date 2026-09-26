import { Outlet } from "reroute";
import { NavigationSpinner } from "./NavigationSpinner";

export function RootLayout({ message }: { message: string }) {
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
