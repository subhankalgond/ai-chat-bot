'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { generateUUID } from '@/lib/utils';
import {
  X,
  FolderOpen,
  Plus,
  Folder,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  defaultModelId: string;
  createdAt: string;
}

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-code',
    name: 'Full-Stack Engineering',
    description: 'System design, TypeScript, API architecture, and debugging.',
    systemPrompt: 'You are an elite principal software architect. Provide clean, secure, type-safe code with architectural rationale.',
    defaultModelId: 'gemini-3.5-flash',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-research',
    name: 'Scientific & Academic Research',
    description: 'Deep paper synthesis, literature review, and mathematical proofs.',
    systemPrompt: 'You are a senior academic researcher. Cite methodologies, formulate mathematical hypotheses, and use KaTeX equations.',
    defaultModelId: 'gemini-3.8-flash',
    createdAt: new Date().toISOString(),
  },
];

export function ProjectsModal({ isOpen, onClose }: ProjectsModalProps) {
  const { createNewConversation, setSelectedModelId } = useChat();
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nova_projects_v1');
      if (saved) {
        setProjects(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveProjects = (updated: Project[]) => {
    setProjects(updated);
    localStorage.setItem('nova_projects_v1', JSON.stringify(updated));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const newProj: Project = {
      id: generateUUID(),
      name: name.trim(),
      description: desc.trim() || 'Custom project workspace',
      systemPrompt: prompt.trim(),
      defaultModelId: 'gemini-3.5-flash',
      createdAt: new Date().toISOString(),
    };
    saveProjects([newProj, ...projects]);
    setName('');
    setDesc('');
    setPrompt('');
    setIsCreating(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
  };

  const handleLaunchProject = (project: Project) => {
    setSelectedModelId(project.defaultModelId);
    if (project.systemPrompt) {
      localStorage.setItem('nova_user_instructions', project.systemPrompt);
    }
    createNewConversation(`Project: ${project.name}`, project.defaultModelId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <FolderOpen className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">NOVA Projects</h3>
              <p className="text-[11px] text-muted-foreground">
                Dedicated workspaces with customized directives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Your Active Projects</span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background font-medium text-xs hover:opacity-90 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleLaunchProject(proj)}
                    className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-border transition-all cursor-pointer group flex items-start justify-between"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-sm text-foreground">{proj.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{proj.description}</p>
                      {proj.systemPrompt && (
                        <p className="text-[10px] text-muted-foreground/80 italic line-clamp-1 pt-1 font-mono">
                          Directive: "{proj.systemPrompt}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors border border-border/60">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="font-semibold text-foreground text-sm">Create New Project</div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous Agents Research"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-secondary/60 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Multi-agent consensus algorithms and benchmarks"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-secondary/60 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Custom Project System Directive</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Provide answers formatted in Python with unit tests and complexity analysis..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-secondary/60 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="px-4 py-1.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Save Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end bg-secondary/20">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

