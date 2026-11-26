import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save, X } from "lucide-react";
import api from "../../services/api";

function EditDosage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", status: "active" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // load the dosage form to fill the boxes
  useEffect(() => {
    const loadDosage = async () => {
      try {
        const res = await api.get(`/dosage-forms/${id}`);
        const { name, status } = res.data.data;
        setForm({ name, status });
      } catch (err) {
        console.error("Load dosage error:", err);
        setErrors({
          general: err.response?.data?.message || "Failed to load dosage form",
        });
      } finally {
        setLoading(false);
      }
    };
    loadDosage();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) {
      setErrors({ name: "Dosage form name is required" });
      return;
    }
    try {
      setSaving(true);
      await api.put(`/dosage-forms/${id}`, form);
      navigate("/dosage-forms");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update dosage form";

      if (err.response?.status === 409) {
        setErrors({ name: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand">Edit Dosage Form</h1>
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-lg bg-white p-6 shadow"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Dosage Form Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Oral"
              className={`w-full rounded border px-3 py-2 text-sm outline-none focus:border-brand ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {errors.general && (
          <p className="mt-4 text-sm text-red-600">{errors.general}</p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Update"}
          </button>
          <Link
            to="/dosage-forms"
            className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <X size={16} />
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default EditDosage;