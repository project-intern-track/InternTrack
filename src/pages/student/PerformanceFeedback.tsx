import { useMemo, useState, useEffect } from 'react';
import { Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { feedbackService, type MyFeedbackPayload } from '../../services/feedbackService';

type SkillScore = {
  key: string;
  label: string;
  score: number;
  maxScore: number; 
};


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  const r = clamp(Math.round(rating * 2) / 2, 0, max);
  return (
    <div className="flex gap-1" aria-label={`${r} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= r;
        return (
          <Star
            key={star}
            size={16}
            fill={filled ? '#f5b301' : 'none'}
            color={filled ? '#f5b301' : '#d1d5db'}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function SkillBar({ label, valuePct }: { label: string; valuePct: number }) {
  const pct = clamp(valuePct, 0, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        <span className="text-sm font-bold text-[#FF8800]">{Math.round(pct)}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF8800] to-orange-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const DEFAULT_SKILLS: SkillScore[] = [
  { key: 'technical_skills', label: 'Technical Skills', score: 0, maxScore: 5 },
  { key: 'communication', label: 'Communication', score: 0, maxScore: 5 },
  { key: 'teamwork', label: 'Team Work', score: 0, maxScore: 5 },

];

export default function PerformanceFeedback() {
  const [data, setData] = useState<MyFeedbackPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    feedbackService.getMyFeedback()
      .then(setData)
      .catch(err => console.error('Failed to fetch feedback:', err))
      .finally(() => setLoading(false));
  }, []);

  const skills = useMemo(() => {
    const apiSkills = data?.skills ?? [];
    const merged = DEFAULT_SKILLS.map(def => {
      const found = apiSkills.find(s => s.key === def.key);
      return found ?? def;
    });
    apiSkills.forEach(s => {
      if (!merged.find(m => m.key === s.key)) merged.push(s);
    });
    return merged.map(s => {
      const maxScore = s.maxScore || 5;
      const score = clamp(Number(s.score ?? 0), 0, maxScore);
      const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return { ...s, maxScore, score, pct };
    });
  }, [data]);

  const recentFeedback = useMemo(() => {
    const list = data?.recentFeedback ?? [];
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data]);

  const totalPages = Math.ceil(recentFeedback.length / itemsPerPage);
  
  const paginatedFeedback = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return recentFeedback.slice(start, start + itemsPerPage);
  }, [recentFeedback, currentPage]);


  if (loading) {
    return (
      <div className="p-6 text-gray-400">Loading feedback…</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Performance Feedback
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your skill ratings and supervisor evaluations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Skills Overview */}
        <section className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6 flex flex-col h-[600px]" aria-label="Skills Overview">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex-shrink-0">Skills Overview</h2>
          <div className="space-y-5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {skills.map((s) => (
              <SkillBar key={s.key} label={s.label} valuePct={(s as SkillScore & { pct: number }).pct} />
            ))}
          </div>
        </section>

        {/* Recent Feedback */}
        <section className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6 flex flex-col h-[600px]" aria-label="Recent Feedback">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex-shrink-0">Recent Feedback</h2>

          {recentFeedback.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500 flex-1">
              No feedback yet. Once your supervisor submits evaluations, they&apos;ll appear here.
            </div>
          )}

          {recentFeedback.length > 0 && (
            <>
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {paginatedFeedback.map((fb) => (
                  <article
                    key={fb.id}
                    className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-800/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                        {fb.competency}
                      </span>
                      <Stars rating={fb.rating} />
                    </div>
                    {fb.taskName && (
                      <p className="text-xs font-semibold text-[#FF8800] mb-1.5">{fb.taskName}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2.5">
                      <Calendar size={12} />
                      {formatDate(fb.createdAt)}
                      {fb.reviewerName ? ` · ${fb.reviewerName}` : ''}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed m-0">
                      {fb.comment}
                    </p>
                  </article>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
