import { createFileRoute, redirect } from "@tanstack/react-router";

/** Today is folded into Dashboards; old links land there. */
export const Route = createFileRoute("/today")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
