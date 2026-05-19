import React from 'react';
import { Concept } from '../../data/learning';

interface ConceptCardProps {
  concept: Concept;
  index: number;
  onClick: () => void;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({ concept, index, onClick }) => (
  <div
    onClick={onClick}
    style={{ animationDelay: `${index * 40}ms` }}
    className="group relative p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden panel-glass"
  >
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex items-start justify-between mb-2">
      <div className="p-2 rounded-lg bg-white/5 text-secondary group-hover:scale-110 transition-transform">
        {concept.icon}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-text-muted font-bold tracking-tighter uppercase">Mastery</span>
        <span className="text-xs text-white">{(concept.mastery * 100).toFixed(0)}%</span>
      </div>
    </div>

    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-secondary transition-colors uppercase tracking-tight">
      {concept.title}
    </h3>
    <p className="text-[10px] text-text-muted leading-relaxed mb-3 line-clamp-2">
      {concept.description}
    </p>

    <div className="flex flex-wrap gap-1.5">
      {concept.tags.map(tag => (
        <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-text-muted uppercase tracking-widest">
          {tag}
        </span>
      ))}
    </div>

    <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        style={{ width: `${concept.mastery * 100}%` }}
        className="h-full bg-gradient-to-r from-primary to-secondary"
      />
    </div>
  </div>
);
