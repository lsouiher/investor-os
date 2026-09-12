"use client";

// Matches the roadmap milestone shape from GET /api/v1/strategies/:id
interface Milestone {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  sort_order: number;
  is_completed: boolean;
}

interface RoadmapTimelineProps {
  milestones: Milestone[];
  onComplete: (id: string) => void;
}

export default function RoadmapTimeline({
  milestones,
  onComplete,
}: RoadmapTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.sort_order - b.sort_order);

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No milestones defined yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((milestone, idx) => {
        const isLast = idx === sorted.length - 1;
        const isPast = !!milestone.target_date && new Date(milestone.target_date) < new Date();

        return (
          <div key={milestone.id} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (!milestone.is_completed) onComplete(milestone.id);
                }}
                disabled={milestone.is_completed}
                className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  milestone.is_completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isPast
                      ? "border-red-300 bg-white text-red-400 hover:border-red-400"
                      : "border-gray-300 bg-white text-gray-400 hover:border-amber-400 hover:text-amber-500"
                }`}
                title={milestone.is_completed ? "Completed" : "Click to mark complete"}
              >
                {milestone.is_completed ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </button>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 ${
                    milestone.is_completed ? "bg-emerald-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-semibold ${
                    milestone.is_completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {milestone.title}
                </h4>
                {milestone.target_date && (
                  <span className="text-xs text-gray-400">
                    {new Date(milestone.target_date).toLocaleDateString()}
                  </span>
                )}
                {!milestone.is_completed && isPast && (
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                    Overdue
                  </span>
                )}
              </div>
              {milestone.description && (
                <p className="mt-1 text-sm text-gray-500">{milestone.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
