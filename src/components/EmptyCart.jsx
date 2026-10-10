import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "./ButtonPrimary";

export default function EmptyCart() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-[80px]">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-[#f5f5f7] rounded-full flex items-center justify-center">
          <ShoppingCart size={48} className="text-[#7a7a7a]" />
        </div>
      </div>
      <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-2">
        {t("cart.emptyTitle")}
      </h2>
      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-6">
        {t("cart.emptySubtitle")}
      </p>
      <Link to="/buscar">
        <ButtonPrimary>
          <span className="flex items-center gap-2">
            {t("cart.explore")}
            <ArrowRight size={20} />
          </span>
        </ButtonPrimary>
      </Link>
    </div>
  );
}
