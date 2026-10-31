import React, { useMemo } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelinePhase } from '../types';
import { formatEventDate } from '../utils/date';

interface TimelineSectionProps {
  phases: TimelinePhase[];
  onToggleTask: (phaseId: string, taskId: string) => void;
  onRegenerateTimeline: () => void;
  isRegenerating: boolean;
}

export const TimelineSection: React.FC<TimelineSectionProps> = React.memo(({
  phases,
  onToggleTask,
  onRegenerateTimeline,
  isRegenerating,
}) => {
  // Memoize total and completed tasks
  const { totalTasks, completedTasks, progressPercent } = useMemo(() => {
    const tasks = phases.flatMap((p) => p.tasks);
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalTasks: total, completedTasks: completed, progressPercent: percent };
  }, [phases]);

  const handleTaskClick = (phaseId: string, taskId: string, currentlyCompleted: boolean) => {
    onToggleTask(phaseId, taskId);

    // If this click completes all remaining tasks, trigger celebratory confetti!
    if (!currentlyCompleted && completedTasks + 1 === totalTasks && totalTasks > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <CalendarClock className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Preparation Roadmap & Milestones
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological milestone schedule with actionable priority flags and interactive checklist tracking.
          </p>
        </div>

        <button
          onClick={onRegenerateTimeline}
          disabled={isRegenerating}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-semibold transition disabled:opacity-50 self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-purple-600"
          aria-label="Regenerate timeline roadmap section"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-purple-600' : ''}`} />
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Timeline'}</span>
        </button>
      </div>

      {/* Interactive Progress Bar */}
      <div className="bg-cream-50/90 border border-cream-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
            {progressPercent}%
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              Checklist Progress: {completedTasks} of {totalTasks} Tasks Completed
            </div>
            <div className="text-[11px] text-slate-500">
              {progressPercent === 100
                ? '🎉 All milestones completed! Ready for a flawless celebration.'
                : 'Click or press Enter/Space on any task below to mark it done as you finalize arrangements.'}
            </div>
          </div>
        </div>

        <div
          className="w-full sm:w-48 bg-cream-200 rounded-full h-3 overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Milestone preparation progress ${progressPercent} percent`}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-700 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Phased Timeline List */}
      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => {
          const phaseCompletedCount = phase.tasks.filter((t) => t.completed).length;

          return (
            <div
              key={phase.id}
              className="border border-cream-200 rounded-2xl p-5 bg-[#FAF8F5]/60 hover:bg-white transition-all space-y-3.5"
            >
              {/* Phase Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-cream-200/80">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    {phaseIdx + 1}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 font-serif">
                    {phase.phaseName}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{phase.timeframe}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({phaseCompletedCount}/{phase.tasks.length} done)
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5" role="list" aria-label={`Tasks for ${phase.phaseName}`}>
                {phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    role="checkbox"
                    aria-checked={task.completed}
                    tabIndex={0}
                    onClick={() => handleTaskClick(phase.id, task.id, task.completed)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleTaskClick(phase.id, task.id, task.completed);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                      task.completed
                        ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-500'
                        : 'bg-white border-cream-200 hover:border-purple-300 hover:shadow-xs text-slate-800'
                    }`}
                    aria-label={`Milestone task: ${task.title}, priority: ${task.priority}, status: ${task.completed ? 'completed' : 'pending'}`}
                  >
                    {/* Checkbox Icon */}
                    <div className="pt-0.5 shrink-0" aria-hidden="true">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-purple-600 transition" />
                      )}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div
                          className={`font-semibold text-sm ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {task.category && (
                            <span className="text-[10px] font-medium bg-cream-100 text-slate-600 px-2 py-0.5 rounded">
                              {task.category}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              task.priority === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          task.completed ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {task.description}
                      </p>

                      {task.dueDate && (
                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                          <span>Target:</span>
                          <span className="text-slate-600">{formatEventDate(task.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

TimelineSection.displayName = 'TimelineSection';
