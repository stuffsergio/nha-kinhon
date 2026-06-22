import { useMutation } from "@tanstack/react-query";
import { api, setTokens } from "../services/api";

export function useDeliveryLogin() {
  return useMutation({
    mutationFn: ({ email, password }) =>
      api.post("/delivery/auth/login", { email, password }, { auth: false }),
    onSuccess: (data) => {
      setTokens(data.accessToken);
    },
  });
}

export function useDeliveryRegister() {
  return useMutation({
    mutationFn: ({ name, email, password, phone, vehicle, serviceArea }) =>
      api.post("/delivery/auth/register", { name, email, password, phone, vehicle, serviceArea }, { auth: false }),
    onSuccess: (data) => {
      setTokens(data.accessToken);
    },
  });
}
