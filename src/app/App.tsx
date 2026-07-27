import AppRoutes from "../routes";
import { AlertProvider } from "../store/alert.store";
import AlertModal from "../components/ui/AlertModal";
import { HomeProductProvider } from "../store/homeProduct.store";
import { CatalogProvider } from "../store/catalog.store";
import { CategoryProductProvider } from "../store/categoryProduct.store";
import { BrandProductProvider } from "../store/brandProduct.store";
import { ProductDetailsProvider } from "../store/productDetails.store";
import { useEffect } from "react";

export default function App() {

  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      if (target.tagName === "BUTTON") return;
      const form = target.closest("form");
      if (form) return;
      const submitButton = document.querySelector(
        '[data-enter-submit="true"]'
      ) as HTMLButtonElement | null;
      submitButton?.click();
    };
    document.addEventListener("keydown", handleEnter);

    return () => document.removeEventListener("keydown", handleEnter);
  }, []);

  return (<AlertProvider>
    <HomeProductProvider>
      <CatalogProvider>
        <CategoryProductProvider>
          <BrandProductProvider>
            <ProductDetailsProvider>
              <AppRoutes />
              <AlertModal />
            </ProductDetailsProvider>
          </BrandProductProvider>
        </CategoryProductProvider>
      </CatalogProvider>
    </HomeProductProvider>
  </AlertProvider>
  );
}
