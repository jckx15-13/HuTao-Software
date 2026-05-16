import { useState } from 'react';
import { motion } from 'motion/react';
import { useLearningStore } from '../../store/learningStore';
import { IconButton } from '../common/IconButton';
import { KnowledgeNexus } from './KnowledgeNexus';
import { SynapticFlow } from './SynapticFlow';
import { BookOpen, Plus, Trash2, GraduationCap, Zap, List, Network as NetworkIcon } from 'lucide-react';

export function LearningDashboard() {
  const { concepts, addConcept, updateMastery, removeConcept } = useLearningStore();
  const [newTitle, setNewTitle] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'nexus' | 'flow'>('list');

  const handleIngest = () => {
    if (!newTitle.trim()) return;
    addConcept({
      title: newTitle,
      description: 'Newly ingested neural data source. Analyzing structure...',
      mastery: 0,
      tags: ['new', 'neural-data']
    });
    setNewTitle('');
  };

  return (
    <div className="flex h-full flex-col p-4 overflow-y-auto custom-scrollbar">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-main">
              Learning Module
            </h2>
          </div>

          <div className="flex gap-1 p-1 rounded-md bg-panel/50 border border-panel-border">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-main'}`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('nexus')}
              className={`p-1.5 rounded transition-all ${viewMode === 'nexus' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-main'}`}
              title="Neural Nexus"
            >
              <NetworkIcon className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('flow')}
              className={`p-1.5 rounded transition-all ${viewMode === 'flow' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-main'}`}
              title="Synaptic Flow"
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleIngest()}
            placeholder="Neural Data Source..."
            className="flex-1 bg-base/50 border border-panel-border rounded px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            onClick={handleIngest}
            className="flex items-center gap-1 rounded-sm bg-primary/20 px-3 py-1.5 text-[10px] font-bold text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
          >
            <Plus className="h-3 w-3" />
            INGEST
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid gap-4">
          {concepts.map((concept, index) => (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-lg border border-panel-border bg-panel/30 p-4 panel-glass hover:border-primary/50 transition-all"
            >
              {/* Progress bar background */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-panel-border/20">
                <motion.div 
                  className="h-full bg-primary shadow-[0_0_8px_var(--theme-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${concept.mastery}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                  {concept.title}
                </h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton 
                    icon={Zap} 
                    label="Boost Mastery" 
                    size="xs" 
                    onClick={() => updateMastery(concept.id, 5)} 
                  />
                  <IconButton 
                    icon={Trash2} 
                    label="Remove" 
                    size="xs" 
                    onClick={() => removeConcept(concept.id)} 
                  />
                </div>
              </div>

              <p className="text-xs text-text-muted line-clamp-2 mb-3">
                {concept.description}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex gap-2">
                  {concept.tags.map(tag => (
                    <span key={tag} className="text-primary/70">#{tag}</span>
                  ))}
                </div>
                <span className="text-text-muted">MASTERY: {concept.mastery}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : viewMode === 'nexus' ? (
        <div className="flex-1 min-h-[400px]">
          <KnowledgeNexus />
        </div>
      ) : (
        <div className="flex-1 min-h-[400px]">
          <SynapticFlow />
        </div>
      )}

      {concepts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
          <BookOpen className="h-12 w-12 mb-4 text-text-muted" />
          <p className="text-sm font-mono uppercase tracking-wider">No active neural paths found</p>
        </div>
      )}
    </div>
  );
}
