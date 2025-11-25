import React, { useState, useCallback } from 'react';
import { Category } from '../types';

interface SearchFilterProps {
    onSearchChange: (query: string) => void;
    onFilterChange: (filters: FilterState) => void;
    categories: Category[];
    currentFilters: FilterState;
}

export interface FilterState {
    category: string;
    dateFrom: string;
    dateTo: string;
    amountMin: string;
    amountMax: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    onSearchChange,
    onFilterChange,
    categories,
    currentFilters
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>(currentFilters);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        // Debounce search
        const timer = setTimeout(() => {
            onSearchChange(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [onSearchChange]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const emptyFilters: FilterState = {
            category: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };
        setFilters(emptyFilters);
        setSearchQuery('');
        onSearchChange('');
        onFilterChange(emptyFilters);
    };

    const hasActiveFilters = filters.category || filters.dateFrom || filters.dateTo ||
        filters.amountMin || filters.amountMax || searchQuery;

    return (
        <div className="mb-4">
            {/* Search Bar */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search by merchant name..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${showFilters || hasActiveFilters
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        title="Clear all filters"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
                    {/* Category Filter */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Amount Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Min Amount</label>
                            <input
                                type="number"
                                value={filters.amountMin}
                                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                                placeholder="0"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Max Amount</label>
                            <input
                                type="number"
                                value={filters.amountMax}
                                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                                placeholder="∞"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilter;
