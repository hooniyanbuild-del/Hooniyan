import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ChatMessage,
  Milestone,
  PaymentTerm,
  Project,
  ProjectNotification,
  SitePhoto,
  WeeklyProgress,
} from '../types/project';

const clip = (val: string | undefined, max: number, fallback = ''): string => {
  const safe = (val ?? fallback).trim();
  return safe.length > max ? safe.slice(0, max) : safe;
};

const sanitizeId = (raw: string): string => {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `id-${Date.now()}`;
};

export async function seedProjectIfMissing(initialProject: Project): Promise<void> {
  const projectPath = `projects/${initialProject.id}`;
  const projectRef = doc(db, 'projects', initialProject.id);

  try {
    const snap = await getDoc(projectRef);
    if (snap.exists()) {
      if (snap.data().clientName === 'Ria Suwartiningsih') {
        await updateDoc(projectRef, {
          clientName: clip(initialProject.clientName, 120, 'Ibu Ria Suwartiningsih'),
          updatedAt: serverTimestamp(),
        });
      }
      return;
    }

    const batch = writeBatch(db);
    batch.set(projectRef, {
      id: sanitizeId(initialProject.id),
      contractNumber: clip(initialProject.contractNumber, 100, '[belum diisi]'),
      title: clip(initialProject.title, 200, '[belum diisi]'),
      clientName: clip(initialProject.clientName, 120, '[belum diisi]'),
      clientPhone: clip(initialProject.clientPhone, 60, '[belum diisi]'),
      clientEmail: clip(initialProject.clientEmail, 120, '[belum diisi]'),
      location: clip(initialProject.location, 300, '[belum diisi]'),
      city: clip(initialProject.city, 100, '[belum diisi]'),
      totalBudgetFormatted: clip(initialProject.totalBudgetFormatted, 60, '[belum diisi]'),
      landArea: clip(initialProject.landArea, 40, '[belum diisi]'),
      buildingArea: clip(initialProject.buildingArea, 40, '[belum diisi]'),
      startDate: clip(initialProject.startDate, 40, '[belum diisi]'),
      targetCompletionDate: clip(initialProject.targetCompletionDate, 40, '[belum diisi]'),
      totalWeeks: Math.max(1, Math.min(520, initialProject.totalWeeks)),
      currentWeek: Math.max(0, Math.min(520, initialProject.currentWeek)),
      supervisorName: clip(initialProject.supervisorName, 120, '[belum diisi]'),
      supervisorTitle: clip(initialProject.supervisorTitle, 120, '[belum diisi]'),
      supervisorPhone: clip(initialProject.supervisorPhone, 60, '[belum diisi]'),
      projectManager: clip(initialProject.projectManager, 120, '[belum diisi]'),
      currentProgress: Math.max(0, Math.min(100, initialProject.currentProgress)),
      plannedProgress: Math.max(0, Math.min(100, initialProject.plannedProgress)),
      status: initialProject.status,
      unreadNotificationsCount: Math.max(0, initialProject.unreadNotificationsCount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    initialProject.milestones.forEach((m, index) => {
      const mId = sanitizeId(m.id);
      const mRef = doc(db, 'projects', initialProject.id, 'milestones', mId);
      batch.set(mRef, {
        id: mId,
        projectId: initialProject.id,
        order: index,
        name: clip(m.name, 160, '[belum diisi]'),
        category: m.category,
        weight: Math.max(0, Math.min(100, m.weight)),
        startDate: clip(m.startDate, 40, '[belum diisi]'),
        targetEndDate: clip(m.targetEndDate, 40, '[belum diisi]'),
        ...(m.actualEndDate ? { actualEndDate: clip(m.actualEndDate, 40) } : {}),
        status: m.status,
        progressPercent: Math.max(0, Math.min(100, m.progressPercent)),
        supervisorNotes: clip(m.supervisorNotes, 500, ''),
        updatedAt: serverTimestamp(),
      });
    });

    (initialProject.paymentTerms || []).forEach((term, index) => {
      const tId = `term-${index + 1}`;
      const tRef = doc(db, 'projects', initialProject.id, 'paymentTerms', tId);
      batch.set(tRef, {
        id: tId,
        projectId: initialProject.id,
        order: index,
        termin: clip(term.termin, 100, '[belum diisi]'),
        percentage: Math.max(0, Math.min(100, term.percentage)),
        nominalFormatted: clip(term.nominalFormatted, 60, '[belum diisi]'),
        scope: clip(term.scope, 300, '[belum diisi]'),
        targetBobot: Math.max(0, Math.min(100, term.targetBobot)),
        status: term.status,
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, projectPath);
  }
}

export interface ProjectSubscriptionsCallbacks {
  onProjectMeta: (meta: Partial<Project>) => void;
  onMilestones: (milestones: Milestone[]) => void;
  onWeeklyRecords: (records: WeeklyProgress[]) => void;
  onPhotos: (photos: SitePhoto[]) => void;
  onMessages: (messages: ChatMessage[]) => void;
  onPaymentTerms: (terms: PaymentTerm[]) => void;
  onNotifications: (notifications: ProjectNotification[]) => void;
}

export function subscribeToProjectData(
  projectId: string,
  callbacks: ProjectSubscriptionsCallbacks
): () => void {
  const unsubscribers: Unsubscribe[] = [];

  const rootPath = `projects/${projectId}`;
  unsubscribers.push(
    onSnapshot(
      doc(db, 'projects', projectId),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          callbacks.onProjectMeta({
            id: d.id,
            contractNumber: d.contractNumber,
            title: d.title,
            clientName: d.clientName,
            clientPhone: d.clientPhone,
            clientEmail: d.clientEmail,
            location: d.location,
            city: d.city,
            totalBudgetFormatted: d.totalBudgetFormatted,
            landArea: d.landArea,
            buildingArea: d.buildingArea,
            startDate: d.startDate,
            targetCompletionDate: d.targetCompletionDate,
            totalWeeks: d.totalWeeks,
            currentWeek: d.currentWeek,
            supervisorName: d.supervisorName,
            supervisorTitle: d.supervisorTitle,
            supervisorPhone: d.supervisorPhone,
            projectManager: d.projectManager,
            currentProgress: d.currentProgress,
            plannedProgress: d.plannedProgress,
            status: d.status,
            unreadNotificationsCount: d.unreadNotificationsCount,
          });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, rootPath)
    )
  );

  const milestonesPath = `projects/${projectId}/milestones`;
  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'milestones'), where('projectId', '==', projectId)),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ data: d.data(), order: Number(d.data().order ?? 0) }))
            .sort((a, b) => a.order - b.order)
            .map(({ data }) => ({
              id: data.id,
              name: data.name,
              category: data.category,
              weight: data.weight,
              startDate: data.startDate,
              targetEndDate: data.targetEndDate,
              actualEndDate: data.actualEndDate,
              status: data.status,
              progressPercent: data.progressPercent,
              supervisorNotes: data.supervisorNotes,
            })) as Milestone[];
          callbacks.onMilestones(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, milestonesPath)
    )
  );

  const weeklyPath = `projects/${projectId}/weeklyRecords`;
  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'weeklyRecords'), where('projectId', '==', projectId)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data())
          .sort((a, b) => Number(a.week) - Number(b.week))
          .map((data) => ({
            week: data.week,
            periodLabel: data.periodLabel,
            startDate: data.startDate,
            endDate: data.endDate,
            planCumulative: data.planCumulative,
            actualCumulative: data.actualCumulative,
            planWeekly: data.planWeekly,
            actualWeekly: data.actualWeekly,
            deviation: data.deviation,
            evaluationStatus: data.evaluationStatus,
            highlight: data.highlight,
          })) as WeeklyProgress[];
        callbacks.onWeeklyRecords(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, weeklyPath)
    )
  );

  const photosPath = `projects/${projectId}/photos`;
  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'photos'), where('projectId', '==', projectId)),
      (snap) => {
        const list = snap.docs
          .map((d) => {
            const data = d.data();
            const sortKey =
              data.createdAt?.toMillis?.() ??
              (Number(String(data.id).replace(/\D/g, '')) || 0);
            return { data, sortKey };
          })
          .sort((a, b) => b.sortKey - a.sortKey)
          .map(({ data }) => ({
            id: data.id,
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl,
            beforeImageUrl: data.beforeImageUrl,
            date: data.date,
            time: data.time,
            phaseName: data.phaseName,
            category: data.category,
            supervisorName: data.supervisorName,
            weather: data.weather,
            isMilestoneProof: data.isMilestoneProof,
          })) as SitePhoto[];
        callbacks.onPhotos(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, photosPath)
    )
  );

  const messagesPath = `projects/${projectId}/messages`;
  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'messages'), where('projectId', '==', projectId)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data())
          .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
          .map((data) => ({
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            text: data.text,
            timestamp: data.timestamp,
            timeString: data.timeString,
            read: data.read,
          })) as ChatMessage[];
        callbacks.onMessages(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, messagesPath)
    )
  );

  const termsPath = `projects/${projectId}/paymentTerms`;
  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'paymentTerms'), where('projectId', '==', projectId)),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ data: d.data(), order: Number(d.data().order ?? 0) }))
            .sort((a, b) => a.order - b.order)
            .map(({ data }) => ({
              termin: data.termin,
              percentage: data.percentage,
              nominalFormatted: data.nominalFormatted,
              scope: data.scope,
              targetBobot: data.targetBobot,
              status: data.status,
            })) as PaymentTerm[];
          callbacks.onPaymentTerms(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, termsPath)
    )
  );

  const notifsPath = `projects/${projectId}/notifications`;
  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'projects', projectId, 'notifications'), where('projectId', '==', projectId)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data())
          .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
          .map((data) => ({
            id: data.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            type: data.type,
            timestamp: data.timestamp,
            relativeTime: data.relativeTime,
            read: data.read,
            linkTab: data.linkTab,
          })) as ProjectNotification[];
        callbacks.onNotifications(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, notifsPath)
    )
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

export async function updateMilestoneInDb(
  projectId: string,
  milestoneId: string,
  newPercent: number,
  notes: string | undefined,
  currentMilestones: Milestone[]
): Promise<void> {
  const clampedPercent = Math.max(0, Math.min(100, Number(newPercent)));
  const status =
    clampedPercent >= 100
      ? 'selesai'
      : clampedPercent > 0
      ? 'dalam_pengerjaan'
      : 'belum_mulai';

  const updatedMilestones = currentMilestones.map((m) =>
    m.id === milestoneId
      ? {
          ...m,
          progressPercent: clampedPercent,
          status: status as Milestone['status'],
          supervisorNotes: notes !== undefined ? notes : m.supervisorNotes,
        }
      : m
  );

  const totalCalculated = Number(
    updatedMilestones
      .reduce((acc, m) => acc + m.weight * (m.progressPercent / 100), 0)
      .toFixed(1)
  );

  const path = `projects/${projectId}/milestones/${milestoneId}`;
  try {
    const batch = writeBatch(db);
    const targetMilestone = currentMilestones.find((m) => m.id === milestoneId);
    const nextNotes = clip(notes !== undefined ? notes : targetMilestone?.supervisorNotes, 500, '');

    batch.update(doc(db, 'projects', projectId, 'milestones', milestoneId), {
      progressPercent: clampedPercent,
      status,
      supervisorNotes: nextNotes,
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'projects', projectId), {
      currentProgress: Math.max(0, Math.min(100, totalCalculated)),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addWeeklyRecordInDb(
  projectId: string,
  record: WeeklyProgress
): Promise<void> {
  const recordId = `w-${record.week}`;
  const path = `projects/${projectId}/weeklyRecords/${recordId}`;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'projects', projectId, 'weeklyRecords', recordId), {
      id: recordId,
      projectId,
      week: Math.max(1, Math.min(520, record.week)),
      periodLabel: clip(record.periodLabel, 100, `Minggu ke-${record.week}`),
      startDate: clip(record.startDate, 40, '[belum diisi]'),
      endDate: clip(record.endDate, 40, '[belum diisi]'),
      planCumulative: Math.max(0, Math.min(100, record.planCumulative)),
      actualCumulative: Math.max(0, Math.min(100, record.actualCumulative)),
      planWeekly: Math.max(0, Math.min(100, record.planWeekly)),
      actualWeekly: Math.max(0, Math.min(100, record.actualWeekly)),
      deviation: Math.max(-100, Math.min(100, record.deviation)),
      evaluationStatus: record.evaluationStatus,
      highlight: clip(record.highlight, 500, '[belum diisi]'),
      createdAt: serverTimestamp(),
    });

    batch.update(doc(db, 'projects', projectId), {
      currentWeek: Math.max(0, Math.min(520, record.week)),
      plannedProgress: Math.max(0, Math.min(100, record.planCumulative)),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function savePhotoInDb(projectId: string, photo: SitePhoto): Promise<void> {
  const photoId = sanitizeId(photo.id);
  const path = `projects/${projectId}/photos/${photoId}`;

  try {
    await setDoc(doc(db, 'projects', projectId, 'photos', photoId), {
      id: photoId,
      projectId,
      title: clip(photo.title, 160, '[belum diisi]'),
      description: clip(photo.description, 500, '[belum diisi]'),
      imageUrl: clip(photo.imageUrl, 140000),
      ...(photo.beforeImageUrl
        ? { beforeImageUrl: clip(photo.beforeImageUrl, 140000) }
        : {}),
      date: clip(photo.date, 60, '[belum diisi]'),
      time: clip(photo.time, 40, '[belum diisi]'),
      phaseName: clip(photo.phaseName, 160, '[belum diisi]'),
      category: clip(photo.category, 160, '[belum diisi]'),
      supervisorName: clip(photo.supervisorName, 120, '[belum diisi]'),
      weather: clip(photo.weather, 60, '[belum diisi]'),
      isMilestoneProof: Boolean(photo.isMilestoneProof),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function sendMessageInDb(projectId: string, msg: ChatMessage): Promise<void> {
  const msgId = sanitizeId(msg.id);
  const path = `projects/${projectId}/messages/${msgId}`;

  try {
    await setDoc(doc(db, 'projects', projectId, 'messages', msgId), {
      id: msgId,
      projectId,
      senderId: clip(msg.senderId, 128, 'user'),
      senderName: clip(msg.senderName, 120, '[belum diisi]'),
      senderRole: msg.senderRole,
      text: clip(msg.text, 2000),
      timestamp: clip(msg.timestamp, 60, new Date().toISOString()),
      timeString: clip(msg.timeString, 40, ''),
      read: Boolean(msg.read),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createNotificationInDb(
  projectId: string,
  notif: ProjectNotification
): Promise<void> {
  const notifId = sanitizeId(notif.id);
  const path = `projects/${projectId}/notifications/${notifId}`;

  try {
    await setDoc(doc(db, 'projects', projectId, 'notifications', notifId), {
      id: notifId,
      projectId,
      title: clip(notif.title, 160, 'Pembaruan Proyek'),
      description: clip(notif.description, 500, ''),
      type: notif.type,
      timestamp: clip(notif.timestamp, 60, new Date().toISOString()),
      relativeTime: clip(notif.relativeTime, 60, 'Baru saja'),
      read: Boolean(notif.read),
      ...(notif.linkTab ? { linkTab: notif.linkTab } : {}),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationReadInDb(
  projectId: string,
  notifId: string
): Promise<void> {
  const path = `projects/${projectId}/notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId, 'notifications', notifId), {
      read: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsReadInDb(
  projectId: string,
  unreadIds: string[]
): Promise<void> {
  if (unreadIds.length === 0) return;
  const path = `projects/${projectId}/notifications`;
  try {
    const batch = writeBatch(db);
    unreadIds.forEach((id) => {
      batch.update(doc(db, 'projects', projectId, 'notifications', id), { read: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
