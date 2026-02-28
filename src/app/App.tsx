import AppRoutes from "../routes";
import { AlertProvider } from "../store/alert.store";
import AlertModal from "../components/ui/AlertModal";
import { HomeProductProvider } from "../store/homeProduct.store";
import { CatalogProvider } from "../store/catalog.store";
import { CategoryProductProvider } from "../store/categoryProduct.store";
import { BrandProductProvider } from "../store/brandProduct.store";
import { ProductDetailsProvider } from "../store/productDetails.store";

export default function App() {

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
