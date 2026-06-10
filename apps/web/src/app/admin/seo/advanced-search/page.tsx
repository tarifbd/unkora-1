'use client';
import { useState } from 'react';
import { Search, Sliders, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle, BookOpen, Tag, User } from 'lucide-react';

interface SearchSetting { key: string; label: string; description: string; enabled: boolean }
interface WeightSetting { field: string; label: string; weight: number }

const DEFAULT_TOGGLES: SearchSetting[] = [
  { key: 'fuzzy',        label: 'Fuzzy Matching',       description: 'Allow approximate matches for typos and misspellings.',          enabled: true },
  { key: 'synonyms',     label: 'Synonym Expansion',    description: 'Expand queries using a synonym dictionary (e.g. "book" → "novel").',  enabled: true },
  { key: 'autocomplete', label: 'Autocomplete',         description: 'Show search suggestions as the user types.',                    enabled: true },
  { key: 'highlight',    label: 'Result Highlighting',  description: 'Highlight matched keywords in search results.',                  enabled: false },
  { key: 'filters',      label: 'Faceted Filters',      description: 'Enable attribute-based filters (author, genre, publisher) in search.', enabled: true },
  { key: 'spellcheck',   label: 'Spell Check',          description: 'Suggest corrected spelling when no results found.',             enabled: true },
];

const DEFAULT_WEIGHTS: WeightSetting[] = [
  { field: 'name',        label: 'Product Name',  weight: 10 },
  { field: 'author',      label: 'Author',        weight: 8 },
  { field: 'isbn',        label: 'ISBN',          weight: 10 },
  { field: 'description', label: 'Description',   weight: 4 },
  { field: 'category',    label: 'Category',      weight: 6 },
  { field: 'publisher',   label: 'Publisher',     weight: 5 },
  { field: 'genres',      label: 'Genres',        weight: 7 },
];

const INDEXED_FIELDS = [
  { icon: BookOpen, label: 'Book Title',   color: 'text-blue-500',   bg: 'bg-blue-50' },
  { icon: User,     label: 'Author Name', color: 'text-green-500',  bg: 'bg-green-50' },
  { icon: Tag,      label: 'ISBN / SKU',  color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Search,   label: 'Description', color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function AdvancedSearchPage() {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [minChars, setMinChars] = useState(2);
  const [maxResults, setMaxResults] = useState(24);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setToggles(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  const setWeight = (field: string, value: number) => {
    setWeights(prev => prev.map(w => w.field === field ? { ...w, weight: value } : w));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-orange-500" /> Advanced Search
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure site-wide search behaviour, indexing, and ranking weights.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-60 shadow-md shadow-orange-500/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Indexed Fields */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-1">Indexed Fields</h2>
        <p className="text-xs text-gray-500 mb-4">These fields are included in the search index.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {INDEXED_FIELDS.map(f => (
            <div key={f.label} className={`flex items-center gap-2.5 rounded-xl border p-3 ${f.bg} border-transparent`}>
              <f.icon className={`h-4 w-4 flex-shrink-0 ${f.color}`} />
              <span className="text-sm font-medium text-gray-800">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search Feature Toggles */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-gray-400" />
          <h2 className="font-bold text-gray-900">Search Features</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {toggles.map(s => (
            <div key={s.key} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </div>
              <button
                onClick={() => toggle(s.key)}
                className={`flex-shrink-0 transition-colors ${s.enabled ? 'text-orange-500' : 'text-gray-300'}`}
                aria-label={s.enabled ? 'Disable' : 'Enable'}
              >
                {s.enabled
                  ? <ToggleRight className="h-7 w-7" />
                  : <ToggleLeft className="h-7 w-7" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking Weights */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Ranking Weights</h2>
          <p className="text-xs text-gray-500 mt-0.5">Higher weight = more influence on search ranking (1–10).</p>
        </div>
        <div className="divide-y divide-gray-50">
          {weights.map(w => (
            <div key={w.field} className="flex items-center gap-4 px-5 py-3">
              <span className="w-32 text-sm font-medium text-gray-700 flex-shrink-0">{w.label}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={w.weight}
                onChange={e => setWeight(w.field, Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="w-6 text-sm font-black text-orange-500 text-right flex-shrink-0">{w.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Misc Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">General Settings</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Minimum Characters to Trigger Search
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={minChars}
              onChange={e => setMinChars(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <p className="text-xs text-gray-400 mt-1">Search fires after this many characters are typed.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Max Results per Page
            </label>
            <input
              type="number"
              min={6}
              max={96}
              step={6}
              value={maxResults}
              onChange={e => setMaxResults(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <p className="text-xs text-gray-400 mt-1">Number of products shown per search results page.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
