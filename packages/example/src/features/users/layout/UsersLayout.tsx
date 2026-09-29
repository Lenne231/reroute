import type { ReactNode } from "react";

export function UsersLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2>Users</h2>
      {children}
    </div>
  );
}
