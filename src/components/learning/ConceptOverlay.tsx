import React from 'react';
import { Zap } from 'lucide-react';
import { Concept } from '../../data/learning';

interface ConceptOverlayProps {
  concept: Concept;
  onClose: () => void;
}

export const ConceptOverlay: React.FC<ConceptOverlayProps> = ({ concept, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="w-full max-w-lg bg-bg-card border border-secondary/30 rounded-2xl p-8 shadow-2xl relative"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-secondary/10 text-secondary">
          {concept.icon}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{concept.title}</h2>
          <div className="flex gap-2 mt-1">
            {concept.tags.map(tag => (
              <span key={tag} className="text-[10px] text-secondary/70 uppercase tracking-widest font-bold">#{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-text-main leading-relaxed mb-8 font-sans">
        {concept.description}
      </p>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Learning Status</span>
            <span className="text-xl font-black text-secondary">{(concept.mastery * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: `${concept.mastery * 100}%` }} />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button className="flex-1 bg-secondary text-black py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 fill-current" />
            Deep Dive
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);
