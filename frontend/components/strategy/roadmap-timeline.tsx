"use client";

interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  order: number;
}

interface RoadmapTimelineProps {
  milestones: Milestone[];
  onComplete: (id: string) => void;
}

export default function RoadmapTimeline({
  milestones,
  onComplete,
}: RoadmapTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.order - b.order);

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
        const isPast = new Date(milestone.target_date) < new Date();

        return (
          <div key={milestone.id} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (!milestone.completed) onComplete(milestone.id);
                }}
                disabled={milestone.completed}
                className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  milestone.completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isPast
                      ? "border-red-300 bg-white text-red-400 hover:border-red-400"
                      : "border-gray-300 bg-white text-gray-400 hover:border-amber-400 hover:text-amber-500"
                }`}
                title={milestone.completed ? "Completed" : "Click to mark complete"}
              >
                {milestone.completed ? (
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
                    milestone.completed ? "bg-emerald-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-semibold ${
                    milestone.completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {milestone.title}
                </h4>
                <span className="text-xs text-gray-400">
                  {new Date(milestone.target_date).toLocaleDateString()}
                </span>
                {!milestone.completed && isPast && (
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                    Overdue
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{milestone.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
