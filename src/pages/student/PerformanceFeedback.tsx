import { useMemo, useState, useEffect } from 'react';
import { Calendar, Star } from 'lucide-react';
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
  const r = clamp(Math.round(rating * 2) / 2, 0, max); // allow halves in the future
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }} aria-label={`${r} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= r;
        return (
          <Star
            key={star}
            size={18}
            fill={filled ? '#f5b301' : 'none'}
            color={filled ? '#f5b301' : '#d1d5db'}
            style={{ flexShrink: 0 }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontWeight: 700, color: '#111827' }}>{label}</div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        style={{
          height: 12,
          borderRadius: 999,
          background: '#6b6b6b',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(180deg, #ffa726 0%, #ff8c42 100%)',
          }}
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

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: '2rem', color: '#6b7280' }}>
        Loading feedback...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ color: '#ff8c42', marginBottom: '0.25rem' }}>Performance Feedback</h1>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* skills overview*/}
        <section className="card" aria-label="Skills Overview">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>Skills Overview</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {skills.map((s) => (
              <SkillBar key={s.key} label={s.label} valuePct={(s as SkillScore & { pct: number }).pct} />
            ))}
          </div>
        </section>

        {/* recent feedback */}
        <section className="card" aria-label="Recent Feedback">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Feedback</div>

          {recentFeedback.length === 0 && (
            <div style={{ padding: '1rem', color: '#6b7280' }}>
              No feedback yet. Once your supervisor submits evaluations, they’ll appear here.
            </div>
          )}

          {recentFeedback.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentFeedback.map((fb) => (
                <article
                  key={fb.id}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    padding: '1rem',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        fontWeight: 800,
                        color: '#2563eb',
                        fontSize: '1.05rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {fb.competency}
                    </div>
                    <Stars rating={fb.rating} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#6b7280' }}>
                    <Calendar size={16} />
                    <span style={{ fontSize: '0.9rem' }}>
                      {formatDate(fb.createdAt)}
                      {fb.reviewerName ? ` by ${fb.reviewerName}` : ''}
                    </span>
                  </div>

                  <p style={{ marginTop: '0.75rem', marginBottom: 0, color: '#111827', lineHeight: 1.5 }}>
                    {fb.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
