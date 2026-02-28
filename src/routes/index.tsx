import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Products from "../pages/Products";
import CategoryProducts from "../pages/CategoryProducts";
import ProductDetails from "../pages/ProductDetails";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import OrderSuccess from "../pages/OrderSuccess";
import MyOrders from "../pages/MyOrders";
import OrderDetails from "../pages/OrderDetails";
import Register from "../pages/Register";
import About from "../pages/About";
import Contact from "../pages/Contact";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Profile from "../pages/Profile";
import BrandProducts from "../pages/BrandProducts";
import AdjustOrder from "../pages/AdjustOrder";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminOrderDetails from "../pages/admin/AdminOrderDetails";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminCreateProduct from "../pages/admin/AdminCreateProduct";
import AdminEditProduct from "../pages/admin/AdminEditProduct";
import BulkImportPage from "../pages/admin/bulk-import/BulkImportPage";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminCreateCategory from "../pages/admin/AdminCreateCategory";
import AdminEditCategory from "../pages/admin/AdminEditCategory";
import AdminBrands from "../pages/admin/AdminBrands";
import AdminCreateBrand from "../pages/admin/AdminCreateBrand";
import AdminEditBrand from "../pages/admin/AdminEditBrand";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminConfigPage from "../pages/admin/AdminConfigPage";
import AdminDiscountsPage from "../pages/admin/AdminDiscountsPage";
import AdminEditDiscount from "../pages/admin/AdminEditDiscount";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC USER APP ================= */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/category/:categoryId" element={<CategoryProducts />} />
          <Route path="/products/brand/:brandId" element={<BrandProducts />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Route>

        {/* ================= AUTH ================= */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ================= PROTECTED USER ROUTES ================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders/:orderId/adjust" element={<AdjustOrder />} />
          </Route>
        </Route>

        {/* ================= ADMIN ================= */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:orderId" element={<AdminOrderDetails />} />
            <Route path="/admin/orders/:orderId/adjust" element={<AdjustOrder />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/create" element={<AdminCreateProduct />} />
            <Route path="/admin/products/:productId/edit" element={<AdminEditProduct />} />
            <Route path="/admin/products/bulk-import" element={<BulkImportPage />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/categories/create" element={<AdminCreateCategory />} />
            <Route path="/admin/categories/:categoryId/edit" element={<AdminEditCategory />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/brands/create" element={<AdminCreateBrand />} />
            <Route path="/admin/brands/:brandId/edit" element={<AdminEditBrand />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/configs" element={<AdminConfigPage />} />
            <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
            <Route path="/admin/discounts/:discountId/edit" element={<AdminEditDiscount />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
