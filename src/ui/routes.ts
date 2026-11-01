// Screens and how they map to the URL. Hash routing keeps the static site working
// with no server rewrites, and it survives refresh and deep links.
export type Route = "menu" | "map";

export function parseRoute(hash: string): Route {
  return hash === "#map" ? "map" : "menu";
}

export function hrefFor(route: Route): string {
  return route === "map" ? "#map" : "#";
}
