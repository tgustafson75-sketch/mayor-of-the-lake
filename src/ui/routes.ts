// Screens and how they map to the URL. Hash routing keeps the static site working
// with no server rewrites, and it survives refresh and deep links.
export type Route = "menu" | "map" | "life" | "council";

const ROUTES: Record<string, Route> = { "#map": "map", "#life": "life", "#council": "council" };

export function parseRoute(hash: string): Route {
  return ROUTES[hash] ?? "menu";
}

export function hrefFor(route: Route): string {
  const entry = Object.entries(ROUTES).find(([, r]) => r === route);
  return entry ? entry[0] : "#";
}
