import { cn } from '@/shared/lib/cn';

type StateFilter = '' | 'published' | 'scheduled' | 'draft';

interface StateFilterOption {
  value: StateFilter;
  label: string;
}

interface PostsFilterBarProps {
  searchTerm: string;
  stateFilter: StateFilter;
  stateFilterOptions: StateFilterOption[];
  onSearchChange: (value: string) => void;
  onStateFilterChange: (state: StateFilter) => void;
}

export default function PostsFilterBar({
  searchTerm,
  stateFilter,
  stateFilterOptions,
  onSearchChange,
  onStateFilterChange,
}: PostsFilterBarProps) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="제목으로 검색..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex gap-1">
        {stateFilterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onStateFilterChange(option.value)}
            className={cn(
              'px-3 py-2 text-sm rounded-md transition-colors',
              stateFilter === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
