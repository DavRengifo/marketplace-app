type FiltersBarProps = {
  category: string;
  categories: string[];
  location: string;
  locations: string[];
  sort: string;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

export function FiltersBar({
  category,
  categories,
  location,
  locations,
  sort,
  onCategoryChange,
  onLocationChange,
  onSortChange,
}: FiltersBarProps) {
  return (
    <div className="filters-bar">
      <label className="filter-field">
        <span>Category</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Location</span>
        <select value={location} onChange={(event) => onLocationChange(event.target.value)}>
          <option value="">All locations</option>
          {locations.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Sort by</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
          <option value="popular">Most popular</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="">Newest</option>
        </select>
      </label>
    </div>
  );
}
