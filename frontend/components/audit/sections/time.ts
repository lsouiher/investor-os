// Field definitions for the time audit page. Pure data (no React) so the dev fill panel and
// the persona fixture test can read the same ids and option values the form posts.
import type { AuditSection } from "../audit-form-shell";

export const sections: AuditSection[] = [
  {
    id: "work",
    title: "Work Schedule",
    fields: [
      {
        name: "work_hours_per_week",
        label: "Hours worked per week (primary job)",
        type: "select",
        required: true,
        options: [
          { value: "under-20", label: "Under 20 hours" },
          { value: "20-30", label: "20-30 hours" },
          { value: "30-40", label: "30-40 hours" },
          { value: "40-50", label: "40-50 hours" },
          { value: "50-60", label: "50-60 hours" },
          { value: "over-60", label: "Over 60 hours" },
        ],
      },
      {
        name: "commute_hours_per_week",
        label: "Weekly commute time",
        type: "select",
        required: true,
        options: [
          { value: "0", label: "None (remote)" },
          { value: "under-3", label: "Under 3 hours" },
          { value: "3-7", label: "3-7 hours" },
          { value: "7-10", label: "7-10 hours" },
          { value: "over-10", label: "Over 10 hours" },
        ],
      },
      {
        name: "caregiving_hours",
        label: "Weekly caregiving responsibilities",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-5", label: "Under 5 hours" },
          { value: "5-15", label: "5-15 hours" },
          { value: "15-30", label: "15-30 hours" },
          { value: "over-30", label: "Over 30 hours" },
        ],
      },
      {
        name: "side_projects_hours",
        label: "Weekly hours on side projects / hobbies",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-5", label: "Under 5 hours" },
          { value: "5-10", label: "5-10 hours" },
          { value: "10-20", label: "10-20 hours" },
          { value: "over-20", label: "Over 20 hours" },
        ],
      },
    ],
  },
  {
    id: "availability",
    title: "RE Availability",
    fields: [
      {
        name: "re_hours_per_week",
        label: "Hours per week you can dedicate to real estate",
        type: "select",
        required: true,
        options: [
          { value: "under-2", label: "Under 2 hours" },
          { value: "2-5", label: "2-5 hours" },
          { value: "5-10", label: "5-10 hours" },
          { value: "10-20", label: "10-20 hours" },
          { value: "20-30", label: "20-30 hours" },
          { value: "over-30", label: "Over 30 hours (full-time)" },
        ],
      },
      {
        name: "best_times",
        label: "When are you most available for RE activities?",
        type: "select",
        options: [
          { value: "weekday-mornings", label: "Weekday mornings" },
          { value: "weekday-evenings", label: "Weekday evenings" },
          { value: "weekends", label: "Weekends" },
          { value: "flexible", label: "Flexible schedule" },
        ],
      },
    ],
  },
  {
    id: "flexibility",
    title: "Flexibility",
    fields: [
      {
        name: "calls_during_work",
        label: "Can you take RE-related calls during work hours?",
        type: "select",
        required: true,
        options: [
          { value: "yes", label: "Yes, easily" },
          { value: "sometimes", label: "Sometimes, with notice" },
          { value: "rarely", label: "Rarely" },
          { value: "no", label: "No" },
        ],
      },
      {
        name: "weekday_property_visits",
        label: "Can you visit properties on weekdays?",
        type: "select",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "with-notice", label: "With advance notice" },
          { value: "half-days-only", label: "Half days only" },
          { value: "no", label: "No, weekends only" },
        ],
      },
      {
        name: "travel_willingness",
        label: "Willingness to travel for RE opportunities",
        type: "select",
        options: [
          { value: "local-only", label: "Local only (under 1 hour)" },
          { value: "regional", label: "Regional (1-3 hours)" },
          { value: "national", label: "National (willing to fly)" },
          { value: "no-travel", label: "Not willing to travel" },
        ],
      },
      {
        name: "seasonal_changes",
        label: "Does your availability change seasonally?",
        type: "select",
        options: [
          { value: "no", label: "No, consistent year-round" },
          { value: "summer-more", label: "More available in summer" },
          { value: "winter-more", label: "More available in winter" },
          { value: "varies", label: "Varies significantly" },
        ],
      },
    ],
  },
  {
    id: "preferences",
    title: "Involvement Preferences",
    fields: [
      {
        name: "hands_on_preference",
        label: "How hands-on do you want to be?",
        type: "select",
        required: true,
        options: [
          { value: "very-hands-on", label: "Very hands-on (do it myself)" },
          { value: "moderate", label: "Moderate (manage contractors)" },
          { value: "minimal", label: "Minimal (delegate everything)" },
          { value: "purely-passive", label: "Purely passive" },
        ],
      },
      {
        name: "willingness_to_learn",
        label: "Willingness to learn new RE skills",
        type: "select",
        required: true,
        options: [
          { value: "very-willing", label: "Very willing (courses, books, mentors)" },
          { value: "somewhat", label: "Somewhat (learn as I go)" },
          { value: "minimal", label: "Minimal (want a turnkey system)" },
        ],
      },
      {
        name: "management_style",
        label: "Preferred management approach",
        type: "select",
        options: [
          { value: "self-manage", label: "Self-manage everything" },
          { value: "hybrid", label: "Hybrid (self-manage some, hire for rest)" },
          { value: "fully-managed", label: "Hire property management" },
        ],
      },
    ],
  },
  {
    id: "runway",
    title: "Time Runway",
    fields: [
      {
        name: "sustainability",
        label: "How long can you sustain this time commitment?",
        type: "select",
        required: true,
        options: [
          { value: "under-3-months", label: "Under 3 months" },
          { value: "3-6-months", label: "3-6 months" },
          { value: "6-12-months", label: "6-12 months" },
          { value: "1-3-years", label: "1-3 years" },
          { value: "indefinitely", label: "Indefinitely" },
        ],
      },
      {
        name: "future_changes",
        label: "Any expected changes to your availability?",
        type: "select",
        options: [
          { value: "no-changes", label: "No changes expected" },
          { value: "more-time", label: "Expect to have more time soon" },
          { value: "less-time", label: "Expect to have less time soon" },
          { value: "uncertain", label: "Uncertain" },
        ],
      },
    ],
  },
];
