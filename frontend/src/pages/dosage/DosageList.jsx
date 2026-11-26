import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, Plus, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";

const emptyFilters = { search: "", status: "" };

function DosageList() {
  const [dosages, setDosages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);

  // fetch dosage forms listing data
  useEffect(() => {
    const loadDosages = async () => {
      try {
        const res = await api.get("/dosage-forms");
        setDosages(res.data.data);
      } catch (err) {
        console.error("Load dosages error:", err);
        setError("Failed to load dosage forms");
      } finally {
        setLoading(false);
      }
    };
    loadDosages();
  }, []);

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

  // apply the filters (name + status)
  const filtered = dosages.filter((d) => {
    const matchName = d.name
      .toLowerCase()
      .includes(applied.search.trim().toLowerCase());
    const matchStatus = applied.status === "" || d.status === applied.status;
    return matchName && matchStatus;
  });

  // pagination on the filtered list
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const handleDelete = async (dosage) => {
  const result = await Swal.fire({
    title: "Are you sure you want to Delete dosage form?",
    text: `"${dosage.name}" will be permanently deleted.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#773135",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/dosage-forms/${dosage.id}`);
    setDosages(dosages.filter((d) => d.id !== dosage.id));
    // if it was the last row on this page, go back one page
    if (pageRows.length === 1 && page > 1) {
      setPage(page - 1);
    }
    Swal.fire({
      title: "Deleted",
      text: "Dosage form deleted successfully",
      icon: "success",
      confirmButtonColor: "#773135",
      timer: 1500,
    });
  } catch (err) {
    Swal.fire({
      title: "Cannot delete",
      text: err.response?.data?.message || "Failed to delete dosage form",
      icon: "error",
      confirmButtonColor: "#773135",
    });
  }
};

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Dosage Forms</h1>
        <Link
          to="/dosage-forms/add"
          className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
        >
          <Plus size={16} />
          Add Dosage
        </Link>
      </div>
      <form
        onSubmit={handleSearch}
        className="mb-4 rounded-lg bg-white p-4 shadow"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search by name..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
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
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-light text-brand">
            <tr>
              <th className="px-4 py-3">Sr</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
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
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  No dosage forms found
                </td>
              </tr>
            )}
            {pageRows.map((d, index) => (
              <tr
                key={d.id}
                className="border-t border-gray-100 text-gray-900 hover:bg-brand-light/40"
              >
                <td className="px-4 py-3">{startIndex + index + 1}</td>
                <td className="px-4 py-3 font-semibold">{d.name}</td>
                <td className="px-4 py-3">{d.dosage_key}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      d.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(d.created_at).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/dosage-forms/edit/${d.id}`}
                      title="Edit"
                      className="rounded bg-blue-50 p-2 text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      title="Delete"
                      className="rounded bg-red-50 p-2 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {filtered.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + pageSize, filtered.length)} of{" "}
          {filtered.length}
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

export default DosageList;