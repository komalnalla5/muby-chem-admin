import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save, X, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import { CATEGORY_IMAGE_URL } from "../../config";
import ImageUpload from "../../components/ImageUpload";

const SEP = "-";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB

const checkImage = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) return "Image must be under 1 MB";
  return "";
};
const emptyForm = {
  name: "",
  slug: "",
  parent_id: "",
  status: "active",
  is_market_served: false,
  category_img_alt: "",
  meta_title: "",
  meta_keyword: "",
  meta_description: "",
  meta_schema: "",
  meta_canonical: "",
};

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClass = (hasError) =>
  `w-full rounded border px-3 py-2 text-sm outline-none focus:border-brand ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [parents, setParents] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null); // newly chosen image
  const [existingImg, setExistingImg] = useState(""); // image already saved
  const [removeImage, setRemoveImage] = useState(false);
  const isMainCategory = !form.parent_id;
  // load the category and the parent list
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, listRes] = await Promise.all([
          api.get(`/categories/${id}`),
          api.get("/categories"),
        ]);

        const c = catRes.data.data;

        setForm({
          name: c.name || "",
          slug: c.category_key || "",
          parent_id: c.parent_id ? String(c.parent_id) : "",
          status: c.status || "active",
          is_market_served: !!c.is_market_served,
          category_img_alt: c.category_img_alt || "",
          meta_title: c.meta_title || "",
          meta_keyword: c.meta_keyword || "",
          meta_description: c.meta_description || "",
          meta_schema: c.meta_schema || "",
          meta_canonical: c.meta_canonical || "",
        });
        setExistingImg(c.category_img || "");

        // main categories only, and not the category itself
        setParents(
          listRes.data.data.filter(
            (item) => item.parent_id === null && item.id !== Number(id)
          )
        );
      } catch (err) {
        console.error("Load category error:", err);
        setErrors({
          name: err.response?.data?.message || "Failed to load category",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "slug") {
      setForm({ ...form, slug: value.toLowerCase().replace(/\s+/g, SEP) });
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }

    setErrors({
      ...errors,
      [name]: "",
      ...(name === "parent_id" ? { image: "" } : {}),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.name.trim()) {
      return setErrors({ name: "Category name is required" });
    }
    if (!form.slug.trim()) {
      return setErrors({ slug: "Slug is required" });
    }

    if (isMainCategory) {
      if (imageFile) {
        const imageError = checkImage(imageFile);
        if (imageError) return setErrors({ image: imageError });
      } else if (!existingImg || removeImage) {
        return setErrors({ image: "Category image is required" });
      }
    }

    try {
      setSaving(true);

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value ?? "");
      });

      if (isMainCategory) {
        if (imageFile) data.append("category_img", imageFile);
        else if (removeImage) data.append("remove_image", "1");
      }

      await api.put(`/categories/${id}`, data);
      navigate("/categories");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update category";
      const lower = message.toLowerCase();

      if (err.response?.status === 409) setErrors({ slug: message });
      else if (lower.includes("parent")) setErrors({ parent_id: message });
      else if (lower.includes("image")) setErrors({ image: message });
      else if (lower.includes("slug")) setErrors({ slug: message });
      else setErrors({ name: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>     
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Edit Category</h1>
        <div className="flex gap-2">
          <Link
            to="/categories"
            className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-bold text-white hover:bg-gray-100 bg-[#8d8484]"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Basic details */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand">
            Basic Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Category Name" required error={errors.name}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Vitamin A"
                className={inputClass(errors.name)}
              />
            </Field>

            <Field label="Slug" required error={errors.slug}>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g. vitamin-a"
                className={inputClass(errors.slug)}
              />
            
            </Field>

            <Field label="Parent Category" error={errors.parent_id}>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">None (main category)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <div className="flex items-end">
              <div>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="is_market_served"
                    checked={form.is_market_served}
                    onChange={handleChange}
                    className="h-4 w-4 accent-brand"
                  />
                  Show in "Markets We Serve"
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  If you check this, the category will appear in the "Markets
                  We Serve" section on the home page.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-brand">Image</h2>

          <div className="grid gap-4 sm:grid-cols-2">
             <ImageUpload
              label="Category Image"
              required={isMainCategory}
              file={imageFile}
              onChange={(file) => {
                setImageFile(file);
                setErrors({ ...errors, image: file ? checkImage(file) : "" });
              }}
              existingUrl={
                existingImg && !removeImage
                  ? `${CATEGORY_IMAGE_URL}/${existingImg}`
                  : ""
              }
              onRemoveExisting={() => setRemoveImage(true)}
              error={errors.image}
            />

            <Field label="Category Image Alt Text">
              <input
                type="text"
                name="category_img_alt"
                value={form.category_img_alt}
                onChange={handleChange}
                placeholder="e.g. vitamin-a-category"
                className={inputClass(false)}
              />
            </Field>
          </div>
        </div>

        {/* SEO */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand">
            SEO Meta
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta Title">
              <input
                type="text"
                name="meta_title"
                value={form.meta_title}
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>

            <Field label="Meta Keyword">
              <input
                type="text"
                name="meta_keyword"
                value={form.meta_keyword}
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>

            <Field label="Meta Description">
              <textarea
                name="meta_description"
                value={form.meta_description}
                onChange={handleChange}
                rows="3"
                className={inputClass(false)}
              />
            </Field>

            <Field label="Meta Schema">
              <textarea
                name="meta_schema"
                value={form.meta_schema}
                onChange={handleChange}
                rows="3"
                className={inputClass(false)}
              />
            </Field>

            <Field label="Canonical Link">
              <textarea
                name="meta_canonical"
                value={form.meta_canonical}
                onChange={handleChange}
                rows="3"
                className={inputClass(false)}
              />
            </Field>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Update"}
          </button>

          <Link
            to="/categories"
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

export default EditCategory;