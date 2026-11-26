import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import CategoryList from "./pages/categories/CategoryList";
import AddCategory from "./pages/categories/AddCategory";
import EditCategory from "./pages/categories/EditCategory";
import DosageList from "./pages/dosage/DosageList";
import AddDosage from "./pages/dosage/AddDosage";
import EditDosage from "./pages/dosage/EditDosage";
import ProductList from "./pages/products/ProductList";
import ViewProduct from "./pages/products/ViewProduct";
import AddProduct from "./pages/products/AddProduct";
import EditProduct from "./pages/products/EditProduct";

// sidebar menu on click open page wich added here
function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/categories" element={<CategoryList />} /> {/* step3 CategoryList.jsx file is calling   */}
        <Route path="/categories/add" element={<AddCategory />} />
        <Route path="/categories/edit/:id" element={<EditCategory />} />
        {/* dosage form */}
       <Route path="/dosage-forms" element={<DosageList />} />
       <Route path="/dosage-forms/add" element={<AddDosage />} />
       <Route path="/dosage-forms/edit/:id" element={<EditDosage />} />
       {/* product pages */}
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/view/:id" element={<ViewProduct />} />
      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/edit/:id" element={<EditProduct />} />

        <Route
          path="*"
          element={<p className="text-gray-500">Page coming soon</p>}
        />
      </Route>
    </Routes>
  );
}

export default App;