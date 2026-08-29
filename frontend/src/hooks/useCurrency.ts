import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/money";

export function useCurrency() {
  const { t, i18n } = useTranslation("common");
  return (value: string | number) => formatMoney(value, t("currency"), i18n.language);
}
