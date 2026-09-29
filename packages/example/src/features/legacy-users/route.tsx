export function resolveLegacyUsersRoute() {
  return {
    page: null,
    statusCode: 302,
    redirectTo: "/users",
    replace: true,
  };
}

export default resolveLegacyUsersRoute;
