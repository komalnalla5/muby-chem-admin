import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import api from "../../services/api";
import { IMAGE_URL } from "../../config";
import RichText from "../../components/RichText";


function Row({ label, children }) {
  return (
    <div className="border-b border-gray-300 py-3 last:border-b-0">
      <span className="font-bold text-brand">{label}:</span>{" "}
      <span className="text-slate-900">{children || "-"}</span>
    </div>
  );
}
function Info({ label, children }) {
  return (
    <div>
      <p className="font-bold text-sm text-brand">{label}</p>
      <div className="mt-1 text-base text-gray-900">{children || "-"}</div>
    </div>
  );
}

function ViewProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        console.error("Load product error:", err);
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Product Details</h1>
        <div className="flex gap-2">
          <Link
            to="/products"
            className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-bold text-white hover:bg-gray-100 bg-[#8d8484]"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link
            to={`/products/edit/${product.id}`}
            className="flex items-center gap-2 font-bold rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
          >
            <Pencil size={16} />
            Edit
          </Link>
        </div>
      </div>
    <div className="mb-4 rounded-lg bg-white p-6 shadow-lg">
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-[#fdf1f1] p-6 shadow">
          <Row label="Product Name">{product.product_name}</Row>
          <Row label="Grade">{product.grade}</Row>
          <Row label="CAS No">{product.cas_no}</Row>
          <Row label="Dosage Form">
            {product.dosage_forms.map((d) => d.name).join(", ")}
          </Row>
          <Row label="Therapeutic Category">{product.therapeutic_category}</Row>
          <Row label="Muby Product Status">{product.product_status}</Row>
        </div>
        <div className="flex items-center justify-center">
          {product.product_img ? (
            <img
              src={`${IMAGE_URL}/${product.product_img}`}
              alt={product.product_img_alt || product.product_name}
              className="max-h-80 w-full object-contain"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-sm text-gray-500">
              No image
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Additional details */}
    <div className="mb-4 rounded-lg bg-white p-6 shadow">
    <h3 className="mb-4 text-sm font-semibold uppercase text-brand">
      Additional Details
    </h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Status">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                product.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {product.status}
            </span>
          </Info>
          <Info label="Category">
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.categories.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-gray-900"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </Info>
          <Info label="Slug">{product.slug}</Info>
          <Info label="Brand Name">{product.brand_name}</Info>
          <Info label="EC Number">{product.ec_number}</Info>
          <Info label="Formula">{product.formula}</Info>
        </div>
      </div>
    {/* Indication and Mechanism of Action */}
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-3 text-2xl font-semibold text-brand">Indication</h3>
          <RichText html={product.indication} />
        </div>

        <div className="min-w-0">
          <h3 className="mb-3 text-2xl font-semibold text-brand">
            Mechanism Of Action
          </h3>
          <RichText html={product.mechanism_of_action} />
        </div>
      </div>
    </div>

    </div>
  );
}

export default ViewProduct;