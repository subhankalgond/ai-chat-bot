'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { Conversation } from '@/types';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  FolderOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onOpenSettings,
  onOpenAdmin,
}: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    theme,
    toggleTheme,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter conversations by query
  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConvs = filteredConvs.filter((c) => c.isPinned);
  const unpinnedConvs = filteredConvs.filter((c) => !c.isPinned);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-secondary/40 border-r border-border transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-72 sm:w-80'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
              N
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                NOVA AI
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                Multi-Model Core
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors mx-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => createNewConversation()}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-foreground text-background font-medium text-xs shadow-sm hover:opacity-90 transition-all ${
            collapsed ? 'p-2.5' : ''
          }`}
          title="Start New Conversation"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Search Input when expanded */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background/60 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
        {/* Pinned Chats */}
        {pinnedConvs.length > 0 && !collapsed && (
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-500" /> Pinned
            </div>
            {pinnedConvs.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conv={conv}
                isSelected={conv.id === currentConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onStartRename={(e) => handleStartRename(conv, e)}
                onDelete={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                onTogglePin={(e) => {
                  e.stopPropagation();
                  togglePinConversation(conv.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Recent Chats */}
        {!collapsed ? (
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Conversations
            </div>
            {unpinnedConvs.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No conversations yet
              </div>
            )}
            {unpinnedConvs.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conv={conv}
                isSelected={conv.id === currentConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => selectConversation(conv.id)}
                onSaveRename={() => handleSaveRename(conv.id)}
                onStartRename={(e) => handleStartRename(conv, e)}
                onDelete={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                onTogglePin={(e) => {
                  e.stopPropagation();
                  togglePinConversation(conv.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            {conversations.slice(0, 8).map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-xs ${
                  conv.id === currentConversationId
                    ? 'bg-foreground text-background font-semibold'
                    : 'hover:bg-secondary text-muted-foreground'
                }`}
                title={conv.title}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer Controls */}
      <div className="p-3 border-t border-border/60 space-y-1">
        {/* Admin Dashboard */}
        <button
          onClick={onOpenAdmin}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Admin & System Health"
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          {!collapsed && <span>Admin Dashboard</span>}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Settings & Instructions"
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={theme === 'dark' ? 'Switch to Warm Light theme' : 'Switch to Charcoal Dark theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{theme === 'dark' ? 'Warm Light Theme' : 'Charcoal Dark Theme'}</span>}
        </button>
      </div>
    </aside>
  );
}

function ConversationListItem({
  conv,
  isSelected,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onSaveRename,
  onStartRename,
  onDelete,
  onTogglePin,
}: {
  conv: Conversation;
  isSelected: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onSaveRename: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
        isSelected
          ? 'bg-secondary font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={onSaveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename();
            }}
            autoFocus
            className="w-full bg-background px-1.5 py-0.5 rounded border border-border text-xs focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate">{conv.title}</span>
        )}
      </div>

      {/* Action buttons on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onTogglePin}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title={conv.isPinned ? 'Unpin' : 'Pin to top'}
        >
          {conv.isPinned ? <PinOff className="w-3 h-3 text-amber-500" /> : <Pin className="w-3 h-3" />}
        </button>
        <button
          onClick={onStartRename}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Rename"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

