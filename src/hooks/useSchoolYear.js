import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "../api/settings";

// The platform-wide school year label (e.g. "2026/2027") set by the super admin,
// or null when it has not been set yet.
export function useSchoolYear() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
  return data?.schoolYear || null;
}
