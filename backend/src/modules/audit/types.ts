export interface FinancialAuditResponses {
  income?: {
    primary_income?: string;
    secondary_income?: string;
    income_stability?: string;
    income_trend?: string;
    income_diversification?: string;
  };
  assets?: {
    liquid_cash?: string;
    retirement_accounts?: string;
    existing_re_equity?: string;
    other_investments?: string;
    business_equity?: string;
  };
  liabilities?: {
    total_monthly_debt?: string;
    mortgage_rent?: string;
    student_loans?: string;
    auto_loans?: string;
    credit_card_balances?: string;
  };
  credit?: {
    credit_score_range?: string;
    credit_utilization?: string;
    credit_history_length?: string;
  };
  tax?: {
    effective_tax_rate?: string;
    filing_status?: string;
    state_tax_rate?: string;
  };
}

export interface TimeAuditResponses {
  availability?: {
    hours_per_week?: number;
    best_time_blocks?: string;
    weekend_availability?: string;
    travel_flexibility?: string;
    current_commitments?: string;
  };
  flexibility?: {
    schedule_predictability?: string;
    remote_work?: string;
    vacation_days?: number;
    sick_leave_policy?: string;
  };
  preference?: {
    active_vs_passive?: string;
    management_style?: string;
    time_horizon_comfort?: string;
  };
  runway?: {
    months_expenses_saved?: number;
    income_replacement_timeline?: string;
  };
}

export interface SkillsAuditResponses {
  re_experience?: {
    properties_owned?: number;
    years_investing?: number;
    deal_types?: string[];
    markets_familiar?: string[];
    biggest_lesson?: string;
  };
  professional?: {
    current_industry?: string;
    years_experience?: number;
    management_experience?: string;
    financial_analysis?: string;
    negotiation_skill?: string;
  };
  transferable?: {
    project_management?: string;
    contractor_management?: string;
    data_analysis?: string;
    marketing?: string;
    legal_knowledge?: string;
    accounting_knowledge?: string;
  };
  education?: {
    highest_degree?: string;
    re_specific_education?: string;
    certifications?: string[];
  };
  network?: {
    agents?: number;
    lenders?: number;
    contractors?: number;
    attorneys?: number;
    cpas?: number;
    mentors?: number;
    partners?: number;
  };
}

export interface RiskAuditResponses {
  self_assessment?: {
    risk_tolerance_self_rating?: number;
    loss_comfort_level?: string;
  };
  scenarios?: {
    market_drop_20_response?: string;
    tenant_nonpayment_response?: string;
    major_repair_response?: string;
    vacancy_6_months_response?: string;
    interest_rate_spike_response?: string;
  };
  financial_safety?: {
    emergency_fund_months?: number;
    insurance_coverage?: string;
    income_protection?: string;
    exit_strategy_awareness?: string;
  };
  behavioral?: {
    past_investment_losses?: string;
    sleep_test?: string;
    decision_speed?: string;
  };
  comfort_zones?: {
    leverage_comfort?: string;
    partner_comfort?: string;
    geographic_comfort?: string;
    property_condition_comfort?: string;
  };
}

export interface HorizonAuditResponses {
  primary_objective?: {
    goal_ranking?: string[];
  };
  financial_targets?: {
    monthly_cashflow_target?: number;
    total_portfolio_value_target?: number;
    annual_return_target?: number;
    equity_buildup_target?: number;
  };
  timeline?: {
    first_deal_timeline?: string;
    portfolio_size_5yr?: number;
    retirement_timeline?: string;
    wealth_transfer_timeline?: string;
  };
  lifestyle?: {
    location_preference?: string;
    involvement_level?: string;
    growth_vs_income?: string;
    legacy_goals?: string;
  };
  constraints?: {
    geographic_restrictions?: string;
    ethical_constraints?: string;
    family_considerations?: string;
    regulatory_constraints?: string;
  };
}

export type AuditResponses =
  | FinancialAuditResponses
  | TimeAuditResponses
  | SkillsAuditResponses
  | RiskAuditResponses
  | HorizonAuditResponses;

export interface AuditSummary {
  id: string;
  audit_type: string;
  status: string;
  version: number;
  sub_score: number | null;
  last_saved_at: string;
  completed_at: string | null;
}

export interface AuditDetail extends AuditSummary {
  responses: AuditResponses;
}
