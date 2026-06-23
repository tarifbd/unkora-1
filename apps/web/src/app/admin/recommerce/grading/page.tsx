'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

const INITIAL_GRADES = [
  {
    grade: 'A+', labelBn: 'প্রায় নতুন', labelEn: 'Like New', color: 'bg-emerald-100 text-emerald-700',
    criteria: [
      'No visible scratches or damage',
      'All original parts intact',
      'Full functionality guaranteed',
      'Original packaging preferred',
    ],
  },
  {
    grade: 'A', labelBn: 'ভালো অবস্থা', labelEn: 'Good Condition', color: 'bg-green-100 text-green-700',
    criteria: [
      'Minor scratches only (not visible from 30cm)',
      'All parts present and working',
      'No structural damage',
    ],
  },
  {
    grade: 'B', labelBn: 'ব্যবহারযোগ্য', labelEn: 'Usable', color: 'bg-yellow-100 text-yellow-700',
    criteria: [
      'Visible wear and minor damage',
      'Fully functional despite cosmetic issues',
      'All core features work',
    ],
  },
  {
    grade: 'C', labelBn: 'মেরামতযোগ্য', labelEn: 'Needs Repair', color: 'bg-orange-100 text-orange-700',
    criteria: [
      'Significant wear or damage',
      'May require repair or replacement parts',
      'Basic functionality may be impaired',
    ],
  },
];

export default function AdminRecommerceGradingPage() {
  const [grades, setGrades] = useState(INITIAL_GRADES);
  const [saved, setSaved]   = useState(false);

  const addCriteria = (gradeIdx: number) => {
    setGrades(prev => prev.map((g, i) => i === gradeIdx ? { ...g, criteria: [...g.criteria, ''] } : g));
  };

  const updateCriteria = (gradeIdx: number, critIdx: number, val: string) => {
    setGrades(prev => prev.map((g, i) => i === gradeIdx ? {
      ...g, criteria: g.criteria.map((c, ci) => ci === critIdx ? val : c),
    } : g));
  };

  const removeCriteria = (gradeIdx: number, critIdx: number) => {
    setGrades(prev => prev.map((g, i) => i === gradeIdx ? {
      ...g, criteria: g.criteria.filter((_, ci) => ci !== critIdx),
    } : g));
  };

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/recommerce" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">Grading Criteria</h1>
            <p className="text-sm text-gray-500">Define quality standards for each grade tier</p>
          </div>
        </div>
        <button onClick={save}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}>
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {grades.map((g, gi) => (
          <div key={g.grade} className="bg-white rounded-2xl border p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className={`text-sm font-black px-2.5 py-1 rounded-full ${g.color}`}>{g.grade}</span>
              <div>
                <p className="font-bold text-gray-900 text-sm">{g.labelEn}</p>
                <p className="text-xs text-gray-500">{g.labelBn}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Criteria</p>
              {g.criteria.map((crit, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <input value={crit} onChange={e => updateCriteria(gi, ci, e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-400" />
                  <button onClick={() => removeCriteria(gi, ci)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => addCriteria(gi)}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add criterion
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-amber-800 mb-2">Grading Guidelines</p>
        <ul className="space-y-1 text-xs text-amber-700">
          <li>• Sellers self-grade their items when posting. Admins can override during review.</li>
          <li>• Grades are displayed on listing cards and affect buyer trust scores.</li>
          <li>• Disputed grades should be escalated to the quality team.</li>
        </ul>
      </div>
    </div>
  );
}
