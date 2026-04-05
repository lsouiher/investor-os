import type { GrowthPathType, GrowthPathStatus, GrowthStrategyStatus, UnlockType, ExportType } from '@prisma/client';

// Re-export Prisma enums for convenience
export type { GrowthPathType, GrowthPathStatus, GrowthStrategyStatus, UnlockType, ExportType };

// --- Portfolio Growth Content ---

export interface ToolPlaceholder {
  tool_name: string;
  stage: string;
  message: string;
}

export interface ScalingPlan {
  year_1_vision: string;
  year_3_vision: string;
  year_5_vision: string;
  year_10_vision: string;
}

export interface PortfolioContent {
  scaling_plan: ScalingPlan;
  reinvestment_strategy: string;
  diversification_plan: string;
  exit_framework: string;
  financing_evolution: string;
  tool_placeholders: ToolPlaceholder[];
}

// --- Income & Capital Content ---

export interface FundingChannel {
  channel: string;
  accessibility_rank: number;
  description: string;
  requirements: string;
}

export interface CapitalMilestone {
  milestone: string;
  target_amount: string;
  timeline: string;
  portfolio_phase_link: string;
}

export interface IncomeCapitalContent {
  capital_acceleration_plan: string;
  income_growth_roadmap: string;
  funding_channel_map: FundingChannel[];
  professional_transition_plan: string | null;
  capital_milestone_targets: CapitalMilestone[];
}

// --- Skills & Knowledge Content ---

export interface SkillGap {
  skill: string;
  current_level: string;
  target_level: string;
  priority_rank: number;
  portfolio_phase_link: string;
}

export interface ResourceRecommendation {
  type: 'book' | 'course' | 'community' | 'tool';
  name: string;
  url: string | null;
  relevance: string;
}

export interface SkillsKnowledgeContent {
  skill_gap_analysis: SkillGap[];
  learning_roadmap: string;
  resource_recommendations: ResourceRecommendation[];
  network_building_plan: string;
  certification_roadmap: string | null;
  mentorship_strategy: string;
}

// --- Time & Operations Content ---

export interface TimeAuditReality {
  stated_hours: number;
  estimated_actual_hours: number;
  gap_analysis: string;
}

export interface TimeOperationsContent {
  time_audit_reality_check: TimeAuditReality;
  time_recapture_plan: string;
  delegation_roadmap: string;
  systems_and_tools_plan: string;
  active_to_passive_transition: string;
  burnout_prevention: string;
}

// --- Coming Soon Stub ---

export interface ComingSoonContent {
  coming_soon: true;
  title: string;
  description: string;
}

// Union type for all path content
export type PathContent =
  | PortfolioContent
  | IncomeCapitalContent
  | SkillsKnowledgeContent
  | TimeOperationsContent
  | ComingSoonContent;

// --- Action Items ---

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  category: string;
  identity_impact: string;
  priority_score: number;
  is_completed: boolean;
  completed_at: string | null;
}

// --- Cross-Path Links ---

export type CrossPathLinkType = 'prerequisite' | 'enabling' | 'constraint' | 'conflict';

export interface CrossPathLink {
  id: string;
  type: CrossPathLinkType;
  source_path_type: GrowthPathType;
  source_item_id: string;
  source_description: string;
  target_path_type: GrowthPathType;
  target_item_id: string;
  target_description: string;
  description: string;
  resolution: string | null;
}

// --- Next Best Action ---

export interface NextBestAction {
  action_item_id: string;
  path_type: GrowthPathType;
  title: string;
  reason: string;
  cross_path_impact: string[];
}

// --- Unlock Trigger ---

export interface UnlockTriggerDetails {
  reason: string;
  trigger_event?: string;
  completed_count?: number;
  required_count?: number;
}

// --- API Response Shapes ---

export interface GrowthPathSummary {
  id: string;
  path_type: GrowthPathType;
  status: GrowthPathStatus;
  version: number;
  progress: number;
  summary: string | null;
  unlocked_at: string | null;
  unlock_type: UnlockType | null;
  generated_at: string | null;
  action_item_count: number;
  completed_action_items: number;
  unlock_criteria?: string;
  unlock_progress?: string;
}

export interface GrowthStrategyResponse {
  id: string;
  status: GrowthStrategyStatus;
  overall_progress: number;
  growth_score: number;
  identity_version: {
    id: string;
    version: number;
    archetype: string;
    readiness_score: number;
  };
  paths: GrowthPathSummary[];
  cross_path_insights: CrossPathLink[];
  next_best_action: NextBestAction | null;
  export_staleness: {
    is_stale: boolean;
    last_export_at: string | null;
    changed_since_export: string[];
  };
  created_at: string;
}

export interface GrowthPathDetail {
  id: string;
  path_type: GrowthPathType;
  status: GrowthPathStatus;
  version: number;
  progress: number;
  summary: string | null;
  content: PathContent | Record<string, never>;
  action_items: ActionItem[];
  strategy?: {
    id: string;
    name: string;
    fit_score: number;
    action_plan: { item_count: number; completed_count: number };
    roadmap: { milestone_count: number; completed_count: number };
    micro_plan: { task_count: number; completed_count: number; expires_at: string | null };
  };
  unlock_type: UnlockType | null;
  unlocked_at: string | null;
  generated_at: string | null;
  generation_cooldown_until: string | null;
  unlock_criteria?: string;
  unlock_progress?: string;
}

// --- AI Generation Response ---

export interface PathGenerationResponse {
  content: PathContent;
  action_items: ActionItem[];
  summary: string;
}

export interface CrossPathAnalysisResponse {
  links: Omit<CrossPathLink, 'id'>[];
  next_best_action: Omit<NextBestAction, 'action_item_id'> & { action_item_id?: string };
}

// --- Bull Job Payloads ---

export interface PathGenerationJobData {
  tenantId: number;
  userId: number;
  growthStrategyId: number;
  growthPathId: number;
  pathType: GrowthPathType;
  identityVersionId: number;
  strategyId: number | null;
}

export interface CrossPathAnalysisJobData {
  tenantId: number;
  userId: number;
  growthStrategyId: number;
  identityVersionId: number;
}
