import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar paneles, acciones, valores…',
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <Search size={18} className="search-bar__icon" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Búsqueda global"
      />
      {value ? (
        <button
          type="button"
          className="icon-btn"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
