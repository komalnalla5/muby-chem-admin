import { useEffect, useState } from "react";
import { Link, useNavigate  } from "react-router-dom";
import { Save, X, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import MultiSelect from "../../components/MultiSelect";
import ImageUpload from "../../components/ImageUpload";
import RichTextEditor from "../../components/RichTextEditor";

const emptyForm = {
  product_name: "",
  cas_no: "",
  grade: "",
  therapeutic_category: "",
  brand_name: "",
  ec_number: "",
  formula: "",
  product_status: "Commercially Available",
  mechanism_of_action: "",
  indication: "",
  status: "active",
  slug: "",
  molecular_weight: "",
  intro_by: "",
  register: "",
  certificate: "",
  product_img_alt: "",
  category_ids: [],
  dosage_ids: [],
  meta_title: "",
  meta_keyword: "",
  meta_description: "",
  meta_schema: "",
  meta_canonical: "",
  short_name:"",
  other_name:"",
};

// label input display from here
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

function AddProduct() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [dosages, setDosages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const SEP = "-";

   const makeSlug = (text) =>
   text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, SEP)
    .replace(new RegExp(`^${SEP}+|${SEP}+$`, "g"), "");

  // load categories and dosage forms for the multi-selects
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [catRes, dosRes] = await Promise.all([
          api.get("/categories"),
          api.get("/dosage-forms"),
        ]);
        setCategories(catRes.data.data.filter((c) => c.status === "active"));
        setDosages(dosRes.data.data.filter((d) => d.status === "active"));
      } catch (err) {
        console.error("Load options error:", err);
      }
    };
    loadOptions();
  }, []);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.parent_name ? `${c.parent_name} › ${c.name}` : c.name,
  }));
  const dosageOptions = dosages.map((d) => ({ value: d.id, label: d.name }));
  const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "product_name") {
    setForm({
      ...form,
      product_name: value,
      ...(slugEdited ? {} : { slug: makeSlug(value) }),
    });
  } else if (name === "slug") {
    setSlugEdited(value !== "");
    setForm({ ...form, slug: value.toLowerCase().replace(/\s+/g, SEP) });
  } else {
    setForm({ ...form, [name]: value });
  }
  setErrors({
    ...errors,
    [name]: "",
    ...(name === "product_name" ? { slug: "" } : {}),
  });
};

 const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.product_name.trim()) return setErrors({ product_name: "Product name is required" });
    if (!form.slug.trim())         return setErrors({ slug: "Product slug is required" });
    // if (!form.grade.trim())        return setErrors({ grade: "Grade is required" });
    if (!form.cas_no.trim())       return setErrors({ cas_no: "CAS number is required" });
    if (!form.intro_by.trim())     return setErrors({ intro_by: "Intro BY is required" });
    if (!form.category_ids.length) return setErrors({ category_ids: "Please select at least one category" });
    if (!imageFile)                return setErrors({ image: "Product image is required" });

    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "category_ids" || key === "dosage_ids") {
          data.append(key, JSON.stringify(value)); 
        } else {
          data.append(key, value ?? "");
        }
      });
      if (imageFile) data.append("product_img", imageFile);
      await api.post("/products", data);
      navigate("/products");
    }
     catch (err) {
      console.error("Create product error:", err);
      const message = err.response?.data?.message || "Failed to save product";

     if (err.response?.status === 409) {
        setErrors({ slug: message });
      } else if (message.toLowerCase().includes("image")) {
        setErrors({ image: message });
      } else {
        setErrors({ product_name: message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Add Product</h1>
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
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand">
            Basic Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Product Name" required error={errors.product_name}>
              <input
                type="text"
                name="product_name"
                value={form.product_name}
                onChange={handleChange}
                placeholder="e.g. Ammonium Chloride"
                className={inputClass(errors.product_name)}
              />
            </Field>
            <Field label="Slug" required error={errors.slug}>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g. ammonium-chloride-ip-bp-ph-eur"
                className={inputClass(errors.slug)}
              />
            </Field> 
            {/* required error={errors.grade} */}
            <Field label="Grade">
              <input
                type="text"
                name="grade"
                value={form.grade}
                onChange={handleChange}
                placeholder="e.g. IP/BP/Ph.Eur"
                className={inputClass(false)}
              />
            </Field>
            <Field label="CAS No" required error={errors.cas_no}>
              <input
                type="text"
                name="cas_no"
                value={form.cas_no}
                onChange={handleChange}
                placeholder="e.g. 12125-02-9"
                className={inputClass(false)}
              />
            </Field>
            <Field label="Molecular Formula">
              <input
                type="text"
                name="formula"
                value={form.formula}
                onChange={handleChange}
                placeholder="e.g. C6H8O7"
                className={inputClass(false)}
              />
            </Field>
             <Field label="Molecular Weight">
              <input
                type="text"
                name="molecular_weight"
                value={form.molecular_weight}
                onChange={handleChange}
                placeholder="e.g. C6H8O7"
                className={inputClass(false)}
              />
            </Field>
            <Field label="EC Number">
              <input
                type="text"
                name="ec_number"
                value={form.ec_number}
                onChange={handleChange}
                placeholder="e.g. 201-069-1"
                className={inputClass(false)}
              />
            </Field>
            {/* work komal */}
            <Field label="Therapeutic Category">
              <input
                type="text"
                name="therapeutic_category"
                value={form.therapeutic_category}
                onChange={handleChange}
                placeholder="e.g. Expectorant"
                className={inputClass(false)}
              />
            </Field>
            <Field label="Brand Name">
              <input
                type="text"
                name="brand_name"
                value={form.brand_name}
                placeholder="e.g. MOLCARB"
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>
             <Field label="Intro By"  required error={errors.intro_by}>
              <input
                type="text"
                name="intro_by"
                value={form.intro_by}
                placeholder="e.g. Muby Chem"
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>
            <Field label="Register Name">
              <input
                type="text"
                name="register"
                value={form.register}
                placeholder="e.g. USFDA"
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>
             <Field label="Certificate Name">
              <input
                type="text"
                name="certificate"
                value={form.certificate}
                placeholder="e.g. GMP"
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>
            {/* komal nov27*/}
             <Field label="Short Name">
              <input
                type="text"
                name="short_name"
                value={form.short_name}
                placeholder="e.g. Tetrahydrate"
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>
            <Field label="Other Name">
              <input
                type="text"
                name="other_name"
                value={form.other_name}
                placeholder="e.g. Retinol"
                onChange={handleChange}
                className={inputClass(false)}
              />
            </Field>
           {/* komal end */}
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
                onChange={(ids) => setForm({ ...form, category_ids: ids })}
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
            <div>
            <ImageUpload
              label="Product Image"
              required
              file={imageFile}
              onChange={(file) => {
                setImageFile(file);
                setErrors({ ...errors, image: "" });
              }}
              error={errors.image}
            />
            </div>
            <div className="mt-4">
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
        </div>
        {/* Description */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand">
            Description
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Indication" required error={errors.indication}>
                <RichTextEditor
                    value={form.indication}
                    onChange={(html) => setForm({ ...form, indication: html })}
                    placeholder="Write the indication. Use the bullet button for a list."
                />
              </Field>
              <Field label="Mechanism of Action" required error={errors.mechanism_of_action}>
                <RichTextEditor
                    value={form.mechanism_of_action}
                    onChange={(html) => setForm({ ...form, mechanism_of_action: html })}
                    placeholder="Write the mechanism of action."
                />
              </Field>
          </div>
        </div>
        {/* seo tags */}
         <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase text-brand"> SEO Meta </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta Title">
            <input
                type="text"
                name="meta_title"
                value={form.meta_title}
                onChange={handleChange}
                placeholder="e.g. calcium-disodium-edetate-img"
                className={inputClass(false)}
            />
            </Field>
            <Field label="Meta Keyword">
                <input
                type="text"
                name="meta_keyword"
                value={form.meta_keyword}
                onChange={handleChange}
                placeholder="e.g. calcium-disodium-edetate-img"
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
            className="flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
          >
            <Save size={16} />
            Save
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

export default AddProduct;