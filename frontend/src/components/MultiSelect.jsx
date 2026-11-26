import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

function MultiSelect({ options, selected, onChange, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef(null);

  // close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <div ref={boxRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm outline-none focus:border-brand"
        >
          <span className={selected.length ? "text-gray-900" : "text-gray-500"}>
            {selected.length ? `${selected.length} selected` : placeholder}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-brand"
              />
            </div>

            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">No options</li>
              )}

              {filtered.map((o) => (
                <li key={o.value}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-brand-light/40">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.value)}
                      onChange={() => toggle(o.value)}
                      className="h-4 w-4 accent-brand"
                    />
                    {o.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedOptions.map((o) => (
            <span
              key={o.value}
              className="flex items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-medium text-brand"
            >
              {o.label}
              <button type="button" onClick={() => toggle(o.value)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;