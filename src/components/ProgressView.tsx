import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Layers,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { WeeklyProgress, Milestone, UserRole } from '../types/project';
import {
  calculateMilestoneContribution,
  calculateTotalProgress,
  computeScheduledPlannedProgress,
  getWeekDateRange,
} from '../utils/progressSync';

interface ProgressViewProps {
  weeklyRecords: WeeklyProgress[];
  milestones: Milestone[];
  currentProgress: number;
  plannedProgress: number;
  currentWeek: number;
  totalWeeks: number;
  projectStartDate: string;
  currentRole: UserRole;
  activeSubTab?: 'mingguan' | 'tahapan';
  onChangeSubTab?: (tab: 'mingguan' | 'tahapan') => void;
  onUpdateMilestone: (id: string, newPercent: number, notes?: string) => void;
  onAddWeeklyRecord: (record: WeeklyProgress) => void;
  onUpdateWeeklyRecord?: (record: WeeklyProgress, isLatestWeek: boolean) => Promise<void> | void;
  onDeleteWeeklyRecord?: (week: number) => Promise<void> | void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  weeklyRecords,
  milestones,
  currentProgress,
  plannedProgress,
  totalWeeks,
  projectStartDate,
  currentRole,
  activeSubTab,
  onChangeSubTab,
  onUpdateMilestone,
  onAddWeeklyRecord,
  onUpdateWeeklyRecord,
  onDeleteWeeklyRecord,
}) => {
  const [localSubTab, setLocalSubTab] = useState<'mingguan' | 'tahapan'>('mingguan');
  const subTab = activeSubTab ?? localSubTab;
  const setSubTab = onChangeSubTab ?? setLocalSubTab;
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editPercent, setEditPercent] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [showAddWeek, setShowAddWeek] = useState(false);
  const [isManualWeekInput, setIsManualWeekInput] = useState(false);
  const [newActual, setNewActual] = useState(0);
  const [newPlan, setNewPlan] = useState(0);
  const [newHighlight, setNewHighlight] = useState('');
  const [confirmDeleteWeek, setConfirmDeleteWeek] = useState<number | null>(null);

  const [editingWeekNum, setEditingWeekNum] = useState<number | null>(null);
  const [editWeekActual, setEditWeekActual] = useState<number>(0);
  const [editWeekPlan, setEditWeekPlan] = useState<number>(0);
  const [editWeekHighlight, setEditWeekHighlight] = useState<string>('');
  const [isSavingWeekEdit, setIsSavingWeekEdit] = useState(false);

  const effectiveTotalProgress =
    milestones.length > 0 ? calculateTotalProgress(milestones) : currentProgress;

  const lastRecord = weeklyRecords[weeklyRecords.length - 1];
  const prevPlanTotal = lastRecord ? lastRecord.planCumulative : 0;
  const prevActualTotal = lastRecord ? lastRecord.actualCumulative : 0;
  const nextW =
    weeklyRecords.length > 0
      ? Math.max(...weeklyRecords.map((w) => w.week)) + 1
      : 1;

  const scheduledNextPlanCum = computeScheduledPlannedProgress(
    milestones,
    projectStartDate,
    nextW,
    totalWeeks
  );
  const autoActualDelta = Math.max(
    0,
    Number((effectiveTotalProgress - prevActualTotal).toFixed(1))
  );
  const autoPlanDelta = Math.max(
    0,
    Number((scheduledNextPlanCum - prevPlanTotal).toFixed(1))
  );

  const displayPlannedProgress =
    weeklyRecords.length > 0
      ? plannedProgress
      : computeScheduledPlannedProgress(milestones, projectStartDate, 1, totalWeeks);
  const deviation = Number((effectiveTotalProgress - displayPlannedProgress).toFixed(1));

  useEffect(() => {
    if (showAddWeek && !isManualWeekInput) {
      setNewActual(autoActualDelta);
      setNewPlan(autoPlanDelta);
    }
  }, [showAddWeek, isManualWeekInput, autoActualDelta, autoPlanDelta]);

  const handleStartEdit = (m: Milestone) => {
    setEditingMilestoneId(m.id);
    setEditPercent(m.progressPercent);
    setEditNotes(m.supervisorNotes || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateMilestone(id, editPercent, editNotes);
    setEditingMilestoneId(null);
  };

  const handleToggleAddWeek = () => {
    if (!showAddWeek) {
      setIsManualWeekInput(false);
      setNewActual(autoActualDelta);
      setNewPlan(autoPlanDelta);
    }
    setShowAddWeek(!showAddWeek);
  };

  const handleSaveWeek = (e: React.FormEvent) => {
    e.preventDefault();
    const weekDates = getWeekDateRange(projectStartDate, nextW);
    const clampedPlanCum = Math.min(100, Number((prevPlanTotal + newPlan).toFixed(1)));
    const clampedActCum = isManualWeekInput
      ? Math.min(100, Number((prevActualTotal + newActual).toFixed(1)))
      : effectiveTotalProgress;
    const effectiveWeeklyActual = Number((clampedActCum - prevActualTotal).toFixed(1));
    const weekDeviation = Number((clampedActCum - clampedPlanCum).toFixed(1));

    const evaluationStatus: WeeklyProgress['evaluationStatus'] =
      weekDeviation > 0
        ? 'Lebih Cepat'
        : weekDeviation === 0
        ? 'Sesuai Jadwal'
        : 'Perlu Perhatian';

    const newRecord: WeeklyProgress = {
      week: nextW,
      periodLabel:
        weekDates.startDate !== '[belum diisi]'
          ? `Minggu ke-${nextW} (${weekDates.startDate} s/d ${weekDates.endDate})`
          : `Minggu ke-${nextW}`,
      startDate: weekDates.startDate,
      endDate: weekDates.endDate,
      planWeekly: newPlan,
      actualWeekly: Math.max(0, effectiveWeeklyActual),
      planCumulative: clampedPlanCum,
      actualCumulative: clampedActCum,
      deviation: weekDeviation,
      evaluationStatus,
      highlight: newHighlight || '[belum diisi]',
    };

    onAddWeeklyRecord(newRecord);
    setShowAddWeek(false);
    setIsManualWeekInput(false);
    setNewHighlight('');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 max-w-2xl lg:max-w-4xl mx-auto">
      {/* Subtab Segmented Switcher */}
      <div className="bg-[#282929] p-1 rounded-2xl border border-[#444545] flex items-center">
        <button
          onClick={() => setSubTab('mingguan')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            subTab === 'mingguan'
              ? 'bg-[#f95700] text-white shadow-md shadow-[#f95700]/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Rekap Mingguan ({weeklyRecords.length})</span>
        </button>

        <button
          onClick={() => setSubTab('tahapan')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            subTab === 'tahapan'
              ? 'bg-[#f95700] text-white shadow-md shadow-[#f95700]/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tahapan Pekerjaan ({milestones.length})</span>
        </button>
      </div>

      {/* --- SUBTAB 1: REKAP MINGGUAN --- */}
      {subTab === 'mingguan' && (
        <div className="space-y-4">
          <div className="bg-[#282929] border border-[#444545] rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Ringkasan Progres
              </span>
              <span className="text-xs font-bold text-gray-300 bg-[#202121] px-2 py-0.5 rounded-full border border-[#3d3e3e]">
                Deviasi: {deviation >= 0 ? `+${deviation}%` : `${deviation}%`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#3d3e3e]">
              <div>
                <span className="text-[11px] text-gray-400 block">Total Progres Tahapan:</span>
                <span className="text-2xl font-black text-white">{effectiveTotalProgress}%</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">
                  {weeklyRecords.length > 0 ? 'Target Rencana Mingguan:' : 'Target Rencana Minggu ke-1:'}
                </span>
                <span className="text-2xl font-black text-gray-300">{displayPlannedProgress}%</span>
              </div>
            </div>

            {/* S-Curve Chart (if records exist) */}
            {weeklyRecords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#3d3e3e]">
                <span className="text-xs font-semibold text-gray-300 block mb-3">
                  Grafik Kemajuan Mingguan:
                </span>
                <div className="flex items-end space-x-2 h-36 pt-2 pb-1 border-b border-[#3d3e3e]">
                  {weeklyRecords.map((w) => {
                    const heightPercent = Math.min(100, Math.max(5, (w.actualCumulative / 100) * 100));
                    const isLatest = w.week === weeklyRecords.length;

                    return (
                      <div key={w.week} className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[24px] rounded-t-lg transition-all ${
                            isLatest ? 'bg-[#f95700]' : 'bg-amber-500/70'
                          }`}
                        />
                        <span className="text-[10px] mt-2 font-semibold text-gray-400">
                          W{w.week}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Supervisor Action to Add Next Week */}
          {currentRole === 'pengawas' && (
            <div className="flex justify-end">
              <button
                onClick={handleToggleAddWeek}
                className="flex items-center space-x-1.5 bg-[#f95700] hover:bg-[#e04e00] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#f95700]/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Input Rekap Mingguan</span>
              </button>
            </div>
          )}

          {/* Add Week Form */}
          {showAddWeek && (
            <form onSubmit={handleSaveWeek} className="bg-[#282929] border border-[#444545] rounded-2xl p-4 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Input Rekap Minggu Ke-{nextW}</h4>
                <button
                  type="button"
                  onClick={() => setIsManualWeekInput((prev) => !prev)}
                  className="text-[11px] text-[#f95700] hover:underline font-semibold flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isManualWeekInput ? 'Sinkron Otomatis' : 'Sesuaikan Manual'}</span>
                </button>
              </div>

              <div className="bg-[#202121] border border-[#3d3e3e] rounded-xl p-3 space-y-1 text-[11px] text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Akumulasi minggu lalu:</span>
                  <span className="font-bold text-white">{prevActualTotal}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Progres Tahapan saat ini:</span>
                  <span className="font-bold text-emerald-400">{effectiveTotalProgress}%</span>
                </div>
                {!isManualWeekInput && autoActualDelta === 0 && (
                  <div className="pt-1.5 mt-1.5 border-t border-[#2d2e2e] flex items-center justify-between gap-2">
                    <span className="text-amber-300 text-[10px]">
                      Tahapan belum bertambah sejak minggu lalu. Ubah % tahapan atau foto dulu agar otomatis terhitung.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubTab('tahapan')}
                      className="shrink-0 text-[10px] font-bold bg-[#f95700]/20 text-[#f95700] px-2 py-1 rounded-lg border border-[#f95700]/30"
                    >
                      Buka Tahapan
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Kenaikan Minggu Ini (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={Math.max(0, 100 - prevActualTotal)}
                    required
                    disabled={!isManualWeekInput}
                    value={newActual}
                    onChange={(e) => setNewActual(Number(e.target.value))}
                    className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg p-2 text-white disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Target Rencana Minggu Ini (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={Math.max(0, 100 - prevPlanTotal)}
                    required
                    disabled={!isManualWeekInput}
                    value={newPlan}
                    onChange={(e) => setNewPlan(Number(e.target.value))}
                    className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg p-2 text-white disabled:opacity-70"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Uraian Pekerjaan</label>
                <input
                  type="text"
                  required
                  placeholder="Catatan pekerjaan minggu ini..."
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg p-2 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddWeek(false)} className="px-3 py-1.5 text-gray-400">Batal</button>
                <button type="submit" className="bg-[#f95700] text-white px-4 py-1.5 rounded-lg font-bold">Simpan</button>
              </div>
            </form>
          )}

          {/* List or Empty State */}
          {weeklyRecords.length > 0 ? (
            <div className="space-y-2.5">
              {[...weeklyRecords].reverse().map((w) => {
                const isEditingWeek = editingWeekNum === w.week;
                const sortedIdx = weeklyRecords.findIndex((rec) => rec.week === w.week);
                const prevWeek = sortedIdx > 0 ? weeklyRecords[sortedIdx - 1] : undefined;
                const isLatestWeek = sortedIdx === weeklyRecords.length - 1;

                return (
                  <div key={w.week} className="bg-[#282929] border border-[#444545] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-sm font-bold text-white">Minggu ke-{w.week}</span>
                      <span className="text-xs font-black text-amber-400">+{w.actualWeekly}%</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mb-2">{w.periodLabel}</span>

                    {isEditingWeek ? (
                      <div className="space-y-2.5 text-xs bg-[#202121] p-3 rounded-xl border border-[#3d3e3e]">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-gray-300 font-semibold mb-1">
                              Kenaikan Aktual (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editWeekActual}
                              onChange={(e) => setEditWeekActual(Number(e.target.value))}
                              className="w-full bg-[#282929] border border-[#3d3e3e] rounded-lg p-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 font-semibold mb-1">
                              Target Rencana (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editWeekPlan}
                              onChange={(e) => setEditWeekPlan(Number(e.target.value))}
                              className="w-full bg-[#282929] border border-[#3d3e3e] rounded-lg p-2 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-300 font-semibold mb-1">
                            Uraian Pekerjaan
                          </label>
                          <input
                            type="text"
                            value={editWeekHighlight}
                            onChange={(e) => setEditWeekHighlight(e.target.value)}
                            className="w-full bg-[#282929] border border-[#3d3e3e] rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingWeekNum(null)}
                            className="px-3 py-1 text-gray-400 hover:text-white"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={isSavingWeekEdit}
                            onClick={async () => {
                              if (!onUpdateWeeklyRecord) return;
                              setIsSavingWeekEdit(true);
                              try {
                                const baseActual = prevWeek ? prevWeek.actualCumulative : 0;
                                const basePlan = prevWeek ? prevWeek.planCumulative : 0;
                                const nextActualCum = Math.min(100, Number((baseActual + editWeekActual).toFixed(1)));
                                const nextPlanCum = Math.min(100, Number((basePlan + editWeekPlan).toFixed(1)));
                                const nextDev = Number((nextActualCum - nextPlanCum).toFixed(1));
                                const nextEval: WeeklyProgress['evaluationStatus'] =
                                  nextDev > 0
                                    ? 'Lebih Cepat'
                                    : nextDev === 0
                                    ? 'Sesuai Jadwal'
                                    : 'Perlu Perhatian';
                                await onUpdateWeeklyRecord(
                                  {
                                    ...w,
                                    actualWeekly: Math.max(0, editWeekActual),
                                    planWeekly: Math.max(0, editWeekPlan),
                                    actualCumulative: nextActualCum,
                                    planCumulative: nextPlanCum,
                                    deviation: nextDev,
                                    evaluationStatus: nextEval,
                                    highlight: editWeekHighlight.trim() || '[belum diisi]',
                                  },
                                  isLatestWeek
                                );
                                setEditingWeekNum(null);
                              } finally {
                                setIsSavingWeekEdit(false);
                              }
                            }}
                            className="flex items-center space-x-1 bg-[#f95700] text-white px-3 py-1 rounded-lg font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSavingWeekEdit ? 'Menyimpan...' : 'Simpan Koreksi'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-200 bg-[#202121] p-2.5 rounded-xl border border-[#3d3e3e]">
                        {w.highlight}
                      </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-2 border-t border-[#3d3e3e]">
                      <div className="flex items-center space-x-3">
                        <span>Total Progres: <strong className="text-white">{w.actualCumulative}%</strong></span>
                        <span className="text-emerald-400 font-semibold">{w.evaluationStatus}</span>
                      </div>

                      {currentRole === 'pengawas' && !isEditingWeek && (
                        <div className="flex items-center space-x-1.5">
                          {confirmDeleteWeek === w.week ? (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!onDeleteWeeklyRecord) return;
                                  await onDeleteWeeklyRecord(w.week);
                                  setConfirmDeleteWeek(null);
                                }}
                                className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteWeek(null)}
                                className="text-[10px] text-gray-400 hover:text-white px-1.5 py-1"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              {onUpdateWeeklyRecord && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDeleteWeek(null);
                                    setEditingWeekNum(w.week);
                                    setEditWeekActual(w.actualWeekly);
                                    setEditWeekPlan(w.planWeekly);
                                    setEditWeekHighlight(w.highlight);
                                  }}
                                  className="flex items-center space-x-1 text-[10px] font-semibold text-gray-200 hover:text-white bg-[#202121] border border-[#3d3e3e] px-2.5 py-1 rounded-lg"
                                >
                                  <Pencil className="w-3 h-3 text-[#f95700]" />
                                  <span>Koreksi</span>
                                </button>
                              )}
                              {onDeleteWeeklyRecord && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteWeek(w.week)}
                                  className="flex items-center space-x-1 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#282929] border border-[#444545] rounded-2xl p-8 text-center text-xs text-gray-400">
              [belum ada data rekap mingguan]
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: TAHAPAN PEKERJAAN --- */}
      {subTab === 'tahapan' && (
        <div className="space-y-3">
          {milestones.length > 0 ? (
            milestones.map((m, idx) => {
              const isDone = m.status === 'selesai';
              const isEditing = editingMilestoneId === m.id;

              return (
                <div key={m.id} className="bg-[#282929] border border-[#444545] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 rounded-xl bg-[#202121] text-gray-400 shrink-0 border border-[#3d3e3e]">
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{m.name}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Bobot: {m.weight}% (Kontribusi: {calculateMilestoneContribution(m.weight, m.progressPercent)}%) • Target: {m.targetEndDate || '[belum diisi]'}
                        </p>
                        {m.supervisorNotes && (
                          <p className="text-[11px] text-gray-300 bg-[#202121] p-2 rounded-lg mt-2 border border-[#3d3e3e]">
                            Catatan: {m.supervisorNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-white">{m.progressPercent}%</span>
                      {currentRole === 'pengawas' && !isEditing && (
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="mt-1 block text-[11px] text-[#f95700] hover:underline"
                        >
                          Ubah %
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-[#202121] h-2 rounded-full overflow-hidden border border-[#3d3e3e]">
                      <div
                        className="h-full bg-[#f95700] rounded-full transition-all duration-500"
                        style={{ width: `${m.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-[#3d3e3e] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-300 font-semibold">
                          Progres Tahap: <strong className="text-[#f95700]">{editPercent}%</strong>
                        </span>
                        <span className="text-gray-400">
                          Kontribusi: <strong className="text-white">{calculateMilestoneContribution(m.weight, editPercent)}%</strong> / {m.weight}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={editPercent}
                        onChange={(e) => setEditPercent(Number(e.target.value))}
                        className="w-full accent-[#f95700]"
                      />
                      <div className="flex items-center justify-between gap-1.5">
                        {[0, 25, 50, 75, 100].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEditPercent(val)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              editPercent === val
                                ? 'bg-[#f95700] border-[#f95700] text-white'
                                : 'bg-[#202121] border-[#3d3e3e] text-gray-300 hover:text-white'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Catatan inspeksi..."
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg p-2 text-white"
                      />
                      <div className="flex justify-end space-x-2 pt-1">
                        <button onClick={() => setEditingMilestoneId(null)} className="px-3 py-1 text-gray-400">Batal</button>
                        <button onClick={() => handleSaveEdit(m.id)} className="bg-[#f95700] text-white px-3 py-1 rounded-lg font-bold">Simpan</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-[#282929] border border-[#444545] rounded-2xl p-8 text-center text-xs text-gray-400">
              [belum ada data tahapan]
            </div>
          )}
        </div>
      )}
    </div>
  );
};
