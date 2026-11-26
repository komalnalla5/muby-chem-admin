import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Save, X, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import ImageUpload from "../../components/ImageUpload";

const SEP = "-";

const makeSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, SEP)
    .replace(new RegExp(`^${SEP}+|${SEP}+$`, "g"), "");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB

// komal
const checkImage = (file) => {
  if (!file) return "Category image is required";
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

// label + input + error text, used for every field
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

function AddCategory() {
  const [form, setForm] = useState(emptyForm);
  const [parents, setParents] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();
  const isMainCategory = !form.parent_id;

  // load main categories for the Parent dropdown
  useEffect(() => {
    const loadParents = async () => {
      try {
        const res = await api.get("/categories");
        setParents(res.data.data.filter((c) => c.parent_id === null));
      } catch (err) {
        console.error("Load parents error:", err);
      }
    };

    loadParents();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "name") {
      setForm({
        ...form,
        name: value,
        ...(slugEdited ? {} : { slug: makeSlug(value) }),
      });
    } else if (name === "slug") {
      setSlugEdited(value !== "");
      setForm({ ...form, slug: value.toLowerCase().replace(/\s+/g, SEP) });
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }

    setErrors({
      ...errors,
      [name]: "",
      ...(name === "name" ? { slug: "" } : {}),
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
      const imageError = checkImage(imageFile);
      if (imageError) {
        return setErrors({ image: imageError });
      }
   }
   
    try {
      setSaving(true);

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value ?? "");
      });
     if (isMainCategory && imageFile) data.append("category_img", imageFile);

      await api.post("/categories", data);
      navigate("/categories");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save category";
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

  return (
    <div>
       <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Add Category</h1>
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
            {saving ? "Saving..." : "Save"}
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

export default AddCategory;