import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";

function ImageUpload({ label, required, file, onChange, error, existingUrl, onRemoveExisting }) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState("");

  const newPreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => {
    return () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
    };
  }, [newPreview]);
  const preview = newPreview || existingUrl || "";

  const handleSelect = (e) => {
  const selected = e.target.files[0];
  e.target.value = ""; 
  if (!selected) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(selected.type)) {
    setLocalError("Only JPG, PNG or WebP images are allowed");
    return;
  }
  if (selected.size > 1 * 1024 * 1024) {
    setLocalError("Image must be under 1 MB");
    return;
  }
  setLocalError("");
  onChange(selected);
};

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <div className="relative flex min-h-[14rem] flex-col items-center justify-center rounded-lg border border-dashed border-gray-400 bg-gray-100 p-4">
        {preview ? (
          <>
            {/* Replace and remove buttons */}
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current.click()}
                title="Replace image"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand shadow hover:bg-brand-light"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => (file ? onChange(null) : onRemoveExisting && onRemoveExisting())}
                title="Remove image"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-300 bg-white text-red-600 shadow hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-300 p-3">
              <img
                src={preview}
                alt="Preview"
                className="h-40 w-40 rounded object-cover"
              />
            </div>
            <p className="mt-3 max-w-full truncate text-sm text-gray-500">
             {file ? file.name : "Current image"}
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            className="flex flex-col items-center gap-2 text-gray-600 hover:text-brand"
          >
            <ImagePlus size={32} />
            <span className="text-sm">Click to choose image</span>
            <span className="text-xs text-gray-500">
              JPG, PNG or WebP, up to 1 MB
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {(localError || error) && (
        <p className="mt-1 text-sm text-red-600">{localError || error}</p>
      )}
    </div>
  );
}

export default ImageUpload;