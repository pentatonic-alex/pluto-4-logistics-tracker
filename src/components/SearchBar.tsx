'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CampaignStatus } from '@/types';
import type { SearchResult, Suggestion } from '@/lib/projections';

// Re-export types for consumers
export type { SearchResult, Suggestion };

// Match field labels for display
const MATCH_LABELS: Record<SearchResult['matchedField'], string> = {
  campaign_id: 'Campaign ID',
  lego_code: 'LEGO Code',
  description: 'Description',
  tracking: 'Tracking #',
  po: 'PO #',
};

// Status colors
const STATUS_COLORS: Record<CampaignStatus, string> = {
  created: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  inbound_shipment_recorded: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  granulation_complete: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  metal_removal_complete: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  polymer_purification_complete: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  extrusion_complete: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  echa_approved: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  transferred_to_rge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  manufacturing_started: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  manufacturing_complete: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  returned_to_lego: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Fetch suggestions on mount (recent campaigns)
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch('/api/search/suggestions');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }
    fetchSuggestions();
  }, []);

  // Debounced search (reduced to 200ms for faster response)
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      // Don't close dropdown - show suggestions instead
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 200); // Reduced debounce for faster suggestions

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle navigation to campaign
  const navigateToCampaign = useCallback((campaignId: string) => {
    setQuery('');
    setIsOpen(false);
    setResults([]);
    router.push(`/campaigns/${campaignId}`);
  }, [router]);

  // Determine which items to show for keyboard navigation
  const displayItems = query.trim().length > 0 ? results : suggestions;
  const itemCount = displayItems.length;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || itemCount === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < itemCount - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < itemCount) {
          const item = displayItems[selectedIndex];
          navigateToCampaign('campaignId' in item ? item.campaignId : item.campaignId);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [isOpen, itemCount, selectedIndex, displayItems, navigateToCampaign]);

  // Global keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle focus - show suggestions dropdown
  const handleFocus = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(-1);
  }, []);

  // Group results by match type for better organization
  const groupedResults = results.reduce((acc, result) => {
    const group = acc.get(result.matchedField) || [];
    group.push(result);
    acc.set(result.matchedField, group);
    return acc;
  }, new Map<SearchResult['matchedField'], SearchResult[]>());

  // Flatten for keyboard navigation (maintain order)
  const flatResults = results;

  // Determine what to show in dropdown
  const showSuggestions = query.trim().length === 0 && suggestions.length > 0;
  const showResults = query.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search campaigns..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full pl-10 pr-12 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
          aria-label="Search campaigns"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
          role="combobox"
        />
        {/* Keyboard shortcut hint */}
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Results/Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          {/* Show suggestions when query is empty */}
          {showSuggestions && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Campaigns
              </div>
              {suggestions.map((suggestion, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={suggestion.campaignId}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => navigateToCampaign(suggestion.campaignId)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                      isSelected 
                        ? 'bg-zinc-100 dark:bg-zinc-800' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {suggestion.legoCampaignCode}
                      </div>
                      {suggestion.description && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[suggestion.status]}`}>
                      {suggestion.status.replace(/_/g, ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Show search results when query is provided */}
          {showResults && results.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No campaigns found for &ldquo;{query}&rdquo;
            </div>
          )}

          {showResults && results.length > 0 && (
            <div className="py-2">
              {Array.from(groupedResults.entries()).map(([matchType, groupResults]) => (
                <div key={matchType}>
                  {/* Group header */}
                  <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                    {MATCH_LABELS[matchType]}
                  </div>
                  {/* Group results */}
                  {groupResults.map((result) => {
                    const globalIndex = flatResults.findIndex(
                      r => r.campaignId === result.campaignId && r.matchedField === result.matchedField
                    );
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={`${result.campaignId}-${result.matchedField}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => navigateToCampaign(result.campaignId)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                          isSelected 
                            ? 'bg-zinc-100 dark:bg-zinc-800' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        {/* Campaign code */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {result.legoCampaignCode}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {result.matchedValue}
                          </div>
                        </div>
                        {/* Status badge */}
                        <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[result.status]}`}>
                          {result.status.replace(/_/g, ' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Loading state */}
          {showResults && isLoading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
