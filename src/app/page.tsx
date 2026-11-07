'use client';

import React, { useState } from 'react';
import { ChatProvider } from '@/context/ChatContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatArea } from '@/components/chat/ChatArea';
import { VoiceWorkspace } from '@/components/voice/VoiceWorkspace';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AdminDashboardModal } from '@/components/admin/AdminDashboardModal';
import { ImageGenModal } from '@/components/chat/ImageGenModal';
import { useChat } from '@/context/ChatContext';

export default function HomePage() {
  return (
    <ChatProvider>
      <MainAppLayout />
    </ChatProvider>
  );
}

function MainAppLayout() {
  const { imageGenOpen, setImageGenOpen } = useChat();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      {/* Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenAdmin={() => setAdminOpen(true)}
        />
        <ChatArea />
      </div>

      {/* Dedicated Real-Time Live Voice Mode */}
      <VoiceWorkspace />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Admin Telemetry & Health Dashboard */}
      <AdminDashboardModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
      />

      {/* AI Image Studio */}
      <ImageGenModal
        isOpen={imageGenOpen}
        onClose={() => setImageGenOpen(false)}
      />
    </div>
  );
}

