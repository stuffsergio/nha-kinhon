import { useTranslation } from "react-i18next";

export function useOrderStatusLabel() {
  const { t } = useTranslation();
  return (status) => t(`orderStatus.${status}`, { defaultValue: status });
}
