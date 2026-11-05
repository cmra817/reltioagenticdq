import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

export type ScheduledSearch = {
  tab?: "schedules" | "runs";
  schedule?: string;
  run?: string;
};

export function useScheduledNav() {
  const navigate = useNavigate();
  return React.useCallback(
    (search: ScheduledSearch) => {
      void navigate({ to: "/scheduled", search });
    },
    [navigate],
  );
}
