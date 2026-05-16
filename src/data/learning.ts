import { Brain, Code, Cpu, Sparkles } from 'lucide-react';
import React from 'react';

export interface Concept {
  id: string;
  title: string;
  description: string;
  mastery: number;
  tags: string[];
  icon: React.ReactNode;
}

export const INITIAL_CONCEPTS: Concept[] = [
  {
    id: '1',
    title: 'Neural Architectures',
    description: 'Mastering Transformer blocks and attention mechanisms in deep learning models.',
    mastery: 0.85,
    tags: ['AI', 'Deep Learning'],
    icon: React.createElement(Brain, { className: "w-5 h-5" })
  },
  {
    id: '2',
    title: 'React Performance',
    description: 'Optimization techniques: memoization, code splitting, and reconciliation internals.',
    mastery: 0.92,
    tags: ['Frontend', 'React'],
    icon: React.createElement(Code, { className: "w-5 h-5" })
  },
  {
    id: '3',
    title: 'Distributed Systems',
    description: 'Understanding consensus algorithms, sharding, and eventual consistency models.',
    mastery: 0.64,
    tags: ['Backend', 'Scale'],
    icon: React.createElement(Cpu, { className: "w-5 h-5" })
  },
  {
    id: '4',
    title: 'Generative Agents',
    description: 'Building autonomous agents with recursive reasoning and tool-use capabilities.',
    mastery: 0.78,
    tags: ['Agents', 'LLM'],
    icon: React.createElement(Sparkles, { className: "w-5 h-5" })
  }
];
