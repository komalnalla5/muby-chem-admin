import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, X, Plus, Trash2, Pencil, Eye   } from "lucide-react";
import api from "../../services/api";
import { IMAGE_URL } from "../../config";
import Swal from "sweetalert2";

const emptyFilters = { search: "", status: "", category: "" };
// fetch image 
function ProductThumb({ img, name }) {
  const [failed, setFailed] = useState(false);
  if (!img || failed) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded border border-gray-200 bg-gray-100 text-[10px] text-gray-500">
        No image
      </div>
    );
  }
  return (
    <img
      src={`${IMAGE_URL}/${img}`}
      alt={name}
      onError={() => setFailed(true)}
      className="h-20 w-20 rounded border border-gray-200 object-cover"
    />
  );
}

function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [reload, setReload] = useState(0);
  // categories for the filter dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data);
      } catch (err) {
        console.error("Load categories error:", err);
      }
    };
    loadCategories();
  }, []);

  // products fetch
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/products", {
          params: {
            search: applied.search,
            status: applied.status,
            category: applied.category,
            page,
            limit: pageSize,
          },
        });
        setProducts(res.data.data);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      } catch (err) {
        console.error("Load products error:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [applied, page, reload]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setApplied(filters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  };

  const startIndex = (page - 1) * pageSize;

   // Delete product 
    const handleDelete = async (product) => {
    const result = await Swal.fire({
      title: "Move to trash?",
      text: `This product will be moved to Trash. You can restore it later from the Trash page..`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#773135",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;
    try {
      await api.delete(`/products/${product.id}`);
      if (products.length === 1 && page > 1) setPage(page - 1);
      else setReload((n) => n + 1);

      Swal.fire({
        title: "Moved to trash",
        icon: "success",
        confirmButtonColor: "#773135",
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        title: "Cannot delete",
        text: err.response?.data?.message || "Failed to delete product",
        icon: "error",
        confirmButtonColor: "#773135",
      });
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Products</h1>
            <Link
                to="/products/add"
                className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
            >
                <Plus size={16} />
                Add Product
            </Link>
        </div>

      {/* Filter form */}
      <form
        onSubmit={handleSearch}
        className="mb-4 rounded-lg bg-white p-4 shadow"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search by product name..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_name ? `${c.parent_name} › ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
            >
              <Search size={16} />
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* product listing table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-light text-brand">
            <tr>
              <th className="px-4 py-3">Sr</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Dosage Form</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            )}
            {!loading &&
              products.map((p, index) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-100 text-gray-900 hover:bg-brand-light/40"
                >
                  <td className="px-4 py-3">{startIndex + index + 1}</td>
                  <td className="px-4 py-3">
                  <ProductThumb img={p.product_img} name={p.product_name} />
                </td>
                  <td className="px-4 py-3 font-semibold">{p.product_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories
                        ? p.categories.split(", ").map((name) => (
                            <span
                              key={name}
                              className="rounded-full  bg-blue-100 px-2 py-1 text-xs font-medium text-black-800"
                            >
                              {name}
                            </span>
                          ))
                        : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.dosage_forms
                        ? p.dosage_forms.split(", ").map((name) => (
                            <span
                              key={name}
                              className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-black-800"
                            >
                              {name}
                            </span>
                          ))
                        : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.grade || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        p.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                        <Link
                        to={`/products/view/${p.id}`}
                        title="View"
                        className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700"
                        >
                        <Eye size={18} />
                        </Link>
                        <Link
                        to={`/products/edit/${p.id}`}
                        title="Edit"
                        className="rounded-md bg-[#1f71f3] p-2 text-white hover:bg-[#1a5fd1]"
                        >
                        <Pencil size={18} />
                        </Link>
                        <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        title="Delete"
                        className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                    </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {total === 0 ? 0 : startIndex + 1} to{" "}
          {startIndex + products.length} of {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductList;