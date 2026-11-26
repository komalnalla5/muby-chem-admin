import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save, X,ArrowLeft } from "lucide-react";
import api from "../../services/api";
import { IMAGE_URL } from "../../config";
import MultiSelect from "../../components/MultiSelect";
import ImageUpload from "../../components/ImageUpload";
import RichTextEditor from "../../components/RichTextEditor";

const basicFields = [
  { name: "product_name", label: "Product Name", required: true, placeholder: "e.g. Ammonium Chloride" },
  { name: "slug", label: "Slug", required: true, placeholder: "e.g. ammonium_chloride_ip_bp" },
  { name: "grade", label: "Grade", required: true, placeholder: "e.g. IP/BP/Ph.Eur" },
  { name: "cas_no", label: "CAS No", required: true, placeholder: "e.g. 12125-02-9" },
  { name: "formula", label: "Molecular Formula", placeholder: "e.g. NH4Cl" },
  { name: "molecular_weight", label: "Molecular Weight", placeholder: "e.g. 53.49" },
  { name: "ec_number", label: "EC Number", placeholder: "e.g. 235-186-4" },
  { name: "therapeutic_category", label: "Therapeutic Category", placeholder: "e.g. Expectorant" },
  { name: "brand_name", label: "Brand Name", placeholder: "e.g. MOLCARB" },
  { name: "intro_by", label: "Intro By", required: true, placeholder: "e.g. Muby Chem" },
  { name: "register", label: "Register Name", placeholder: "e.g. USFDA" },
  { name: "certificate", label: "Certificate Name", placeholder: "e.g. GMP" },
];

const emptyForm = {
  product_name: "",
  slug: "",
  grade: "",
  cas_no: "",
  formula: "",
  molecular_weight: "",
  ec_number: "",
  therapeutic_category: "",
  brand_name: "",
  intro_by: "",
  register: "",
  certificate: "",
  product_status: "Commercially Available",
  status: "active",
  product_img_alt: "",
  indication: "",
  mechanism_of_action: "",
  meta_title: "",
  meta_keyword: "",
  meta_description: "",
  meta_schema: "",
  meta_canonical: "",
  category_ids: [],
  dosage_ids: [],
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

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [dosages, setDosages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null); 
  const [existingImg, setExistingImg] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  //Fetch edit form pre filed data here
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, catRes, dosRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/categories"),
          api.get("/dosage-forms"),
        ]);
        const p = prodRes.data.data;
        const loaded = { ...emptyForm };
        Object.keys(emptyForm).forEach((key) => {
          if (p[key] !== undefined && p[key] !== null) loaded[key] = p[key];
        });
        loaded.category_ids = p.categories.map((c) => c.id);
        loaded.dosage_ids = p.dosage_forms.map((d) => d.id);
        setForm(loaded);
        setExistingImg(p.product_img || "");
        setCategories(catRes.data.data);
        setDosages(dosRes.data.data);
      } catch (err) {
        console.error("Load product error:", err);
        setErrors({
          general: err.response?.data?.message || "Failed to load product",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // active ones, plus any inactive one this product already uses
  const categoryOptions = categories
    .filter((c) => c.status === "active" || form.category_ids.includes(c.id))
    .map((c) => ({
      value: c.id,
      label: c.parent_name ? `${c.parent_name} › ${c.name}` : c.name,
    }));

  const dosageOptions = dosages
    .filter((d) => d.status === "active" || form.dosage_ids.includes(d.id))
    .map((d) => ({ value: d.id, label: d.name }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    basicFields
      .filter((f) => f.required)
      .forEach((f) => {
        if (!form[f.name].trim()) newErrors[f.name] = `${f.label} is required`;
      });
    if (form.category_ids.length === 0) {
      newErrors.category_ids = "Please select at least one category";
    }

    const hasImage = imageFile || (existingImg && !removeImage);
    if (!hasImage) newErrors.image = "Product image is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "category_ids" || key === "dosage_ids") {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value ?? "");
        }
      });

      if (imageFile) data.append("product_img", imageFile);
      else if (removeImage) data.append("remove_image", "1");
      await api.put(`/products/${id}`, data);
      navigate("/products");
    } catch (err) {
        console.error("Update product error:", err);
        const message = err.response?.data?.message || "Failed to update product";

        if (err.response?.status === 409) setErrors({ slug: message });
        else if (message.toLowerCase().includes("image")) setErrors({ image: message });
        else if (message.toLowerCase().includes("category")) setErrors({ category_ids: message });
        else setErrors({ product_name: message });
        } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      {/* <h1 className="mb-4 text-2xl font-bold text-brand">Edit Product</h1> */}
    <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Edit Product</h1>
        <div className="flex gap-2">
          <Link
            to="/products"
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
            {basicFields.map((f) => (
              <Field
                key={f.name}
                label={f.label}
                required={f.required}
                error={errors[f.name]}
              >
                <input
                  type="text"
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className={inputClass(errors[f.name])}
                />
              </Field>
            ))}
          </div>
        </div>

        {/* Classification */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand">
            Classification
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Categories" required error={errors.category_ids}>
              <MultiSelect
                options={categoryOptions}
                selected={form.category_ids}
                onChange={(ids) => {
                  setForm({ ...form, category_ids: ids });
                  setErrors({ ...errors, category_ids: "" });
                }}
                placeholder="Select categories"
              />
            </Field>
            <Field label="Dosage Forms">
              <MultiSelect
                options={dosageOptions}
                selected={form.dosage_ids}
                onChange={(ids) => setForm({ ...form, dosage_ids: ids })}
                placeholder="Select dosage forms"
              />
            </Field>
            <Field label="Muby Product Status">
              <select
                name="product_status"
                value={form.product_status}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="Commercially Available">
                  Commercially Available
                </option>
                <option value="Under Development">Under Development</option>
                <option value="Not Available">Not Available</option>
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
          </div>
        </div>

        {/* Images */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-brand">Images</h2>
          <div className="grid gap-4 sm:grid-cols-2">
           <ImageUpload
            label="Product Image"
            required
            file={imageFile}
            onChange={(file) => {
                setImageFile(file);
                setErrors({ ...errors, image: "" });
            }}
            existingUrl={
                existingImg && !removeImage ? `${IMAGE_URL}/${existingImg}` : ""
            }
            onRemoveExisting={() => setRemoveImage(true)}
            error={errors.image}
            />
            <Field label="Product Image Alt Text">
              <input
                type="text"
                name="product_img_alt"
                value={form.product_img_alt}
                onChange={handleChange}
                placeholder="e.g. calcium-disodium-edetate-img"
                className={inputClass(false)}
              />
            </Field>
          </div>
        </div>
        {/* Description */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand">
            Description
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Indication">
              <RichTextEditor
                value={form.indication}
                onChange={(html) => setForm({ ...form, indication: html })}
                placeholder="Write the indication."
              />
            </Field>
            <Field label="Mechanism of Action">
              <RichTextEditor
                value={form.mechanism_of_action}
                onChange={(html) =>
                  setForm({ ...form, mechanism_of_action: html })
                }
                placeholder="Write the mechanism of action."
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
        {errors.general && (
          <p className="mb-4 text-sm text-red-600">{errors.general}</p>
        )}
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
            to="/products"
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

export default EditProduct;