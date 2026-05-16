import React, { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { INITIAL_CONCEPTS, Concept } from '../../data/learning';
import { ConceptCard } from './ConceptCard';
import { ConceptOverlay } from './ConceptOverlay';

export function LearningHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConcept, setActiveConcept] = useState<Concept | null>(null);

  const filteredConcepts = INITIAL_CONCEPTS.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden font-mono">
      <div className="p-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 text-secondary mb-4">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-xs uppercase font-black tracking-[0.3em]">LEARNING // HUB</h2>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-secondary transition-colors" />
          <input
            type="text"
            placeholder="FILTER CONCEPTS..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-[10px] focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all placeholder:text-text-muted/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroller">
        <AnimatePresence mode="popLayout">
          {filteredConcepts.map((concept, index) => (
            <ConceptCard 
              key={concept.id} 
              concept={concept} 
              index={index} 
              onClick={() => setActiveConcept(concept)} 
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeConcept && (
          <ConceptOverlay 
            concept={activeConcept} 
            onClose={() => setActiveConcept(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
