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
import { ProjectsModal } from '@/components/projects/ProjectsModal';
import { LibraryModal } from '@/components/library/LibraryModal';
import { ProfileModal } from '@/components/profile/ProfileModal';
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
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      {/* Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
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

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
      />

      {/* Prompt Library Modal */}
      <LibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}

