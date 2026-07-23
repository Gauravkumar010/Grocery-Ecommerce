// src/components/product/ProductFilter.jsx

const ProductFilter = ({ filters, onChange }) => {
  return (
    <div className="card p-5 space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-3">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className="input-field text-sm py-1.5"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="input-field text-sm py-1.5"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
        </label>
      </div>

      <button
        onClick={() => onChange({ minPrice: '', maxPrice: '', inStock: false })}
        className="text-sm text-primary-600 hover:underline"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default ProductFilter;