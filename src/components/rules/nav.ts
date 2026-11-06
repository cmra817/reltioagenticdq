import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

export type RulesSearch = {
  rule?: string;
};

export function useRulesNav() {
  const navigate = useNavigate();
  return React.useCallback(
    (search: RulesSearch) => {
      void navigate({ to: "/rules", search });
    },
    [navigate],
  );
}
