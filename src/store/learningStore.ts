import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import conceptsData from '../data/concepts.json';

export interface Concept {
  id: string;
  title: string;
  description: string;
  mastery: number; // 0 to 100
  lastReviewed: string | null;
  tags: string[];
}

export interface LearningState {
  concepts: Concept[];
  isLearningMode: boolean;
  activeConceptId: string | null;
  searchQuery: string;
  activeCategory: string;
  
  // Actions
  addConcept: (concept: Omit<Concept, 'mastery' | 'lastReviewed'>) => void;
  updateMastery: (id: string, delta: number) => void;
  setLearningMode: (active: boolean) => void;
  setActiveConcept: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  removeConcept: (id: string) => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      concepts: conceptsData as Concept[],
      isLearningMode: false,
      activeConceptId: null,
      searchQuery: '',
      activeCategory: 'all',

      addConcept: (concept) =>
        set((state) => ({
          concepts: [
            ...state.concepts,
            { ...concept, mastery: 0, lastReviewed: null },
          ],
        })),

      updateMastery: (id, delta) =>
        set((state) => ({
          concepts: state.concepts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  mastery: Math.min(100, Math.max(0, c.mastery + delta)),
                  lastReviewed: new Date().toISOString(),
                }
              : c
          ),
        })),

      setLearningMode: (active) => set({ isLearningMode: active }),
      
      setActiveConcept: (id) => set({ activeConceptId: id }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setActiveCategory: (activeCategory) => set({ activeCategory }),

      removeConcept: (id) =>
        set((state) => ({
          concepts: state.concepts.filter((c) => c.id !== id),
          activeConceptId: state.activeConceptId === id ? null : state.activeConceptId,
        })),
    }),
    {
      name: 'learning-storage',
    }
  )
);
