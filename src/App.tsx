import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Project,
  UserRole,
  SitePhoto,
  WeeklyProgress,
  ChatMessage,
  ProjectNotification,
} from './types/project';
import { INITIAL_PROJECTS, INITIAL_NOTIFICATIONS } from './data/mockData';
import { playNotificationSound } from './utils/audio';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import {
  seedProjectIfMissing,
  subscribeToProjectData,
  updateMilestoneInDb,
  addWeeklyRecordInDb,
  savePhotoInDb,
  sendMessageInDb,
  createNotificationInDb,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  deletePhotoInDb,
  deleteWeeklyRecordInDb,
  deleteMessageInDb,
  deleteNotificationInDb,
  updatePhotoInDb,
  updateWeeklyRecordInDb,
} from './services/projectService';
import { Header } from './components/Header';
import { BottomNav, MainTab } from './components/BottomNav';
import { ConsumerHome } from './components/ConsumerHome';
import { ProgressView } from './components/ProgressView';
import { PhotoGalleryTab } from './components/PhotoGalleryTab';
import { LiveChatTab } from './components/LiveChatTab';
import { NotificationModal } from './components/NotificationModal';
import { PhotoUploadModal, PhotoMilestoneUpdate } from './components/PhotoUploadModal';
import { PdfReportModal } from './components/PdfReportModal';
import { LoginModal } from './components/LoginModal';
import { ShareModal } from './components/ShareModal';
import { Bell, X } from 'lucide-react';

const PROJECT_ID = INITIAL_PROJECTS[0].id;

export default function App() {
  // Clean up legacy localStorage keys
  useEffect(() => {
    try {
      localStorage.removeItem('hooniyan_projects_v1');
      localStorage.removeItem('hooniyan_projects_v2');
      localStorage.removeItem('hooniyan_notifications_v1');
      localStorage.removeItem('hooniyan_notifications_v2');
      localStorage.removeItem('hooniyan_project_spk_ria');
      localStorage.removeItem('hooniyan_project_spk_ria_v2');
      localStorage.removeItem('hooniyan_notifications_clean');
      localStorage.removeItem('hooniyan_auth_role');
    } catch {
      // ignore
    }
  }, []);

  // Auth & Role state (persists continuously via Firebase Auth)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [isAuthorizedEditor, setIsAuthorizedEditor] = useState(false);

  const isConsumerShareLink = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'klien' || params.get('share') === '1';
  }, []);

  const activeRole: UserRole =
    isAuthorizedEditor && !isConsumerShareLink ? 'pengawas' : 'klien';

  const [project, setProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [notifications, setNotifications] = useState<ProjectNotification[]>(INITIAL_NOTIFICATIONS);
  const [localReadIds, setLocalReadIds] = useState<string[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbError, setDbError] = useState<Error | null>(null);

  const [activeTab, setActiveTab] = useState<MainTab>('beranda');
  const [progressSubTab, setProgressSubTab] = useState<'mingguan' | 'tahapan'>('mingguan');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [soundEnabled] = useState(true);

  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    targetTab?: MainTab;
  } | null>(null);

  if (dbError) {
    throw dbError;
  }

  // Listen to Firebase Auth state continuously across sessions
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.emailVerified) {
        setSignedInEmail(null);
        setIsAuthorizedEditor(false);

        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'pengawas' || params.get('login') === '1') {
          setIsLoginModalOpen(true);
        }
        return;
      }

      setSignedInEmail(user.email || null);
      setIsAuthorizedEditor(true);
      setIsLoginModalOpen(false);
      try {
        await seedProjectIfMissing(INITIAL_PROJECTS[0]);
      } catch (err) {
        setDbError(err instanceof Error ? err : new Error(String(err)));
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to project live data (View-Only for shared consumer link, editable for logged-in Pengawas)
  useEffect(() => {
    const unsubscribe = subscribeToProjectData(PROJECT_ID, {
      onProjectMeta: (meta) => {
        setProject((prev) => ({ ...prev, ...meta }));
        setIsLoadingDb(false);
      },
      onMilestones: (milestones) => {
        setProject((prev) => ({ ...prev, milestones }));
      },
      onWeeklyRecords: (weeklyRecords) => {
        setProject((prev) => ({ ...prev, weeklyRecords }));
      },
      onPhotos: (photos) => {
        setProject((prev) => ({ ...prev, photos }));
      },
      onMessages: (messages) => {
        setProject((prev) => ({ ...prev, messages }));
      },
      onPaymentTerms: (paymentTerms) => {
        setProject((prev) => ({ ...prev, paymentTerms }));
      },
      onNotifications: (notifs) => {
        setNotifications(notifs);
        setIsLoadingDb(false);
      },
    });

    const timer = setTimeout(() => setIsLoadingDb(false), 1800);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const effectiveNotifications = useMemo(() => {
    if (activeRole === 'pengawas') return notifications;
    return notifications.map((n) =>
      localReadIds.includes(n.id) ? { ...n, read: true } : n
    );
  }, [notifications, activeRole, localReadIds]);

  const unreadChatCount = project.messages.filter(
    (m) => !m.read && m.senderRole !== activeRole
  ).length;

  const triggerNotification = async (
    title: string,
    description: string,
    type: ProjectNotification['type'],
    targetTab?: MainTab
  ) => {
    if (soundEnabled) {
      playNotificationSound();
    }

    const linkTabMap: Record<MainTab, ProjectNotification['linkTab'] | undefined> = {
      beranda: undefined,
      progres: 'rekap',
      galeri: 'galeri',
      chat: 'chat',
    };

    const newNotif: ProjectNotification = {
      id: `notif-${Date.now()}`,
      projectId: project.id,
      title,
      description,
      type,
      timestamp: new Date().toISOString(),
      relativeTime: 'Baru saja',
      read: false,
      linkTab: targetTab ? linkTabMap[targetTab] : undefined,
    };

    setActiveToast({
      id: newNotif.id,
      title,
      message: description,
      targetTab,
    });

    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 4500);

    if (isAuthorizedEditor) {
      try {
        await createNotificationInDb(project.id, newNotif);
      } catch (err) {
        setDbError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  const handleSendMessage = async ({
    text,
    role,
  }: {
    text: string;
    role: UserRole;
    attachmentUrl?: string;
    isVoice?: boolean;
  }) => {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: role === 'klien' ? 'client-1' : 'sup-1',
      senderName:
        role === 'klien'
          ? project.clientName || '[belum diisi]'
          : project.supervisorName || '[belum diisi]',
      senderRole: role,
      text,
      timestamp: now.toISOString(),
      timeString,
      read: false,
    };

    try {
      await sendMessageInDb(project.id, newMsg);
      if (role === 'pengawas') {
        await triggerNotification('Pesan dari Pengawas Lapangan', text, 'chat', 'chat');
      }
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleSavePhoto = async (
    photo: SitePhoto,
    milestoneUpdate?: PhotoMilestoneUpdate
  ) => {
    if (!isAuthorizedEditor) return;
    try {
      await savePhotoInDb(project.id, photo);
      if (milestoneUpdate) {
        await updateMilestoneInDb(
          project.id,
          milestoneUpdate.milestoneId,
          milestoneUpdate.progressPercent,
          undefined,
          project.milestones
        );
      }
      try {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }
      const notifDesc = milestoneUpdate
        ? `${photo.title} • ${milestoneUpdate.milestoneName} (${milestoneUpdate.progressPercent}%)`
        : photo.title;
      await triggerNotification('Foto Lapangan Baru', notifDesc, 'foto', 'galeri');
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleUpdateMilestone = async (id: string, newPercent: number, notes?: string) => {
    if (!isAuthorizedEditor) return;
    try {
      await updateMilestoneInDb(project.id, id, newPercent, notes, project.milestones);
      await triggerNotification(
        'Milestone Proyek Diperbarui',
        `Progres tahapan telah disesuaikan ke ${newPercent}%.`,
        'milestone',
        'progres'
      );
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleAddWeeklyRecord = async (record: WeeklyProgress) => {
    if (!isAuthorizedEditor) return;
    try {
      await addWeeklyRecordInDb(project.id, record);
      await triggerNotification(
        `Rekap Progres Minggu ke-${record.week}`,
        `Penambahan minggu ini +${record.actualWeekly}% (akumulasi mingguan ${record.actualCumulative}%).`,
        'progres',
        'progres'
      );
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!isAuthorizedEditor) return;
    try {
      await deletePhotoInDb(project.id, photoId);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDeleteWeeklyRecord = async (week: number) => {
    if (!isAuthorizedEditor) return;
    try {
      await deleteWeeklyRecordInDb(project.id, week, project.weeklyRecords);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAuthorizedEditor) return;
    try {
      await deleteMessageInDb(project.id, messageId);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (!isAuthorizedEditor) return;
    try {
      await deleteNotificationInDb(project.id, notifId);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleUpdatePhoto = async (
    photoId: string,
    updates: { title: string; description: string; phaseName: string }
  ) => {
    if (!isAuthorizedEditor) return;
    try {
      await updatePhotoInDb(project.id, photoId, updates);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleUpdateWeeklyRecord = async (
    record: WeeklyProgress,
    isLatestWeek: boolean
  ) => {
    if (!isAuthorizedEditor) return;
    try {
      await updateWeeklyRecordInDb(project.id, record, isLatestWeek);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleGoogleLogin = async () => {
    const cred = await signInWithGoogle();
    if (cred.user && !cred.user.emailVerified) {
      await signOutUser();
      throw new Error('email-not-verified');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  return (
    <div className="min-h-screen bg-[#363737] text-gray-100 flex flex-col font-sans selection:bg-[#f95700] selection:text-white">
      {/* 1. Header */}
      <Header
        currentProject={project}
        activeRole={activeRole}
        signedInEmail={signedInEmail}
        showLoginButton={!isConsumerShareLink}
        notifications={effectiveNotifications}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* 2. Main Content */}
      <main className="flex-1 px-3 sm:px-6 pt-4 pb-16 sm:pb-8">
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          unreadChatCount={unreadChatCount}
          currentRole={activeRole}
        />

        {isLoadingDb && (
          <div className="max-w-2xl lg:max-w-4xl mx-auto mb-4 bg-[#282929] border border-[#444545] rounded-2xl px-4 py-3 text-xs text-gray-300 text-center">
            Menyinkronkan data proyek...
          </div>
        )}

        {/* Tab 1: Beranda */}
        {activeTab === 'beranda' && (
          <ConsumerHome
            project={project}
            onNavigateTab={(target) => {
              if (target === 'rekap') {
                setProgressSubTab('mingguan');
                setActiveTab('progres');
              } else if (target === 'timeline') {
                setProgressSubTab('tahapan');
                setActiveTab('progres');
              } else if (target === 'galeri') {
                setActiveTab('galeri');
              } else if (target === 'chat') {
                setActiveTab('chat');
              }
            }}
            onOpenPdf={() => setIsPdfModalOpen(true)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            currentRole={activeRole}
          />
        )}

        {/* Tab 2: Progres */}
        {activeTab === 'progres' && (
          <ProgressView
            weeklyRecords={project.weeklyRecords}
            milestones={project.milestones}
            currentProgress={project.currentProgress}
            plannedProgress={project.plannedProgress}
            currentWeek={project.currentWeek}
            totalWeeks={project.totalWeeks}
            projectStartDate={project.startDate}
            currentRole={activeRole}
            activeSubTab={progressSubTab}
            onChangeSubTab={setProgressSubTab}
            onUpdateMilestone={handleUpdateMilestone}
            onAddWeeklyRecord={handleAddWeeklyRecord}
            onUpdateWeeklyRecord={handleUpdateWeeklyRecord}
            onDeleteWeeklyRecord={handleDeleteWeeklyRecord}
          />
        )}

        {/* Tab 3: Foto */}
        {activeTab === 'galeri' && (
          <PhotoGalleryTab
            photos={project.photos}
            milestones={project.milestones}
            currentRole={activeRole}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onDeletePhoto={handleDeletePhoto}
            onUpdatePhoto={handleUpdatePhoto}
          />
        )}

        {/* Tab 4: Chat */}
        {activeTab === 'chat' && (
          <LiveChatTab
            messages={project.messages}
            currentRole={activeRole}
            supervisorName={project.supervisorName}
            supervisorPhone={project.supervisorPhone}
            clientName={project.clientName}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        )}
      </main>

      {/* 3. Floating Notification Toast */}
      {activeToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 max-w-sm w-auto bg-[#282929] border-2 border-[#f95700] rounded-2xl shadow-2xl p-3.5 text-xs animate-in slide-in-from-bottom-4 flex items-start space-x-3 text-white">
          <div className="p-2 bg-[#f95700]/20 text-[#f95700] rounded-xl shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-white truncate">{activeToast.title}</h5>
              <button
                onClick={() => setActiveToast(null)}
                className="text-gray-400 hover:text-white p-0.5 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-gray-300 text-[11px] mt-0.5 line-clamp-2">
              {activeToast.message}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onGoogleLogin={handleGoogleLogin}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        signedInEmail={signedInEmail}
      />

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={effectiveNotifications}
        currentRole={activeRole}
        onMarkAllAsRead={async () => {
          if (activeRole === 'pengawas') {
            const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
            await markAllNotificationsReadInDb(project.id, unreadIds);
          } else {
            setLocalReadIds(notifications.map((n) => n.id));
          }
        }}
        onMarkAsRead={async (id) => {
          if (activeRole === 'pengawas') {
            await markNotificationReadInDb(project.id, id);
          } else {
            setLocalReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
          }
        }}
        onSelectNotification={(notif) => {
          if (notif.type === 'foto') setActiveTab('galeri');
          else if (notif.type === 'chat') setActiveTab('chat');
          else setActiveTab('progres');
          setIsNotificationOpen(false);
        }}
        onDeleteNotification={handleDeleteNotification}
      />

      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        milestones={project.milestones}
        supervisorName={project.supervisorName}
        onSavePhoto={handleSavePhoto}
      />

      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        project={project}
      />
    </div>
  );
}
