import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useSupporters() {
  return useQuery({
    queryKey: ["supporters"],
    queryFn: () => api.get("/supporters"),
  });
}
