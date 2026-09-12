import { PrismaClient, PromptServiceType } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  // Seed prompt templates
  const templates = [
    {
      serviceType: PromptServiceType.identity_synthesis,
      version: 1,
      isActive: true,
      templateContent: `You are an expert real estate investment advisor analyzing an investor's complete profile.

Given the following audit data for an investor:
<audit_data>
{{AUDIT_DATA}}
</audit_data>

Available archetypes:
<archetypes>
{{ARCHETYPES}}
</archetypes>

Analyze the investor's profile and provide:
1. The best-matching archetype from the list
2. A readiness score (0-100) based on weighted audit sub-scores
3. Radar data for 6 axes: capital, time, skills, risk_tolerance, network, goal_clarity (each 0-100)
4. A headline insight (one compelling sentence summarizing who this investor is)
5. Detailed AI insights including contradictions, feasibility assessment, and gaps

Respond in JSON format:
{
  "archetype": "string",
  "readiness_score": number,
  "sub_scores": {"financial": n, "time": n, "skills": n, "risk": n, "horizon": n},
  "radar_data": {"capital": n, "time": n, "skills": n, "risk_tolerance": n, "network": n, "goal_clarity": n},
  "headline_insight": "string",
  "ai_insights": {"contradictions": [], "feasibility": {}, "gaps": [], "strengths": [], "recommendations": []}
}`,
      outputSchema: {
        type: 'object',
        required: ['archetype', 'readiness_score', 'radar_data', 'headline_insight'],
      },
    },
    {
      serviceType: PromptServiceType.strategy_generation,
      version: 1,
      isActive: true,
      templateContent: `You are an expert real estate investment strategist.

Given this investor identity:
<identity>
{{IDENTITY}}
</identity>

Generate exactly 3 investment strategy recommendations ranked by fit. For each strategy provide:
1. Name (specific strategy name, e.g., "BRRRR in Midwest Markets")
2. Description (2-3 sentences)
3. Fit score (0-100, how well this matches the investor's identity)
4. Pros (3-5 bullet points)
5. Cons (2-3 bullet points)

Respond in JSON format:
{
  "strategies": [
    {
      "name": "string",
      "description": "string",
      "fit_score": number,
      "pros": ["string"],
      "cons": ["string"],
      "rank": number
    }
  ]
}`,
      outputSchema: { type: 'object', required: ['strategies'] },
    },
    {
      serviceType: PromptServiceType.strategy_activation,
      version: 1,
      isActive: true,
      templateContent: `You are an expert real estate investment strategist creating a detailed execution plan.

Given this strategy and investor identity:
<strategy>
Name: {{STRATEGY_NAME}}
Description: {{STRATEGY_DESCRIPTION}}
</strategy>

<identity>
Archetype: {{ARCHETYPE}}
Readiness Score: {{READINESS_SCORE}}
Sub-scores: {{SUB_SCORES}}
Radar Data: {{RADAR_DATA}}
</identity>

Generate a detailed action plan, roadmap with milestones, and a 72-hour micro-plan for this strategy.

Respond in JSON format:
{
  "action_plan": {
    "items": [{"title": "string", "description": "string or null"}]
  },
  "roadmap": {
    "milestones": [{"title": "string", "description": "string or null", "target_date": "ISO string or null"}]
  },
  "micro_plan": {
    "tasks": [{"title": "string", "description": "string or null", "estimated_minutes": number or null}]
  }
}`,
      outputSchema: { type: 'object', required: ['action_plan', 'roadmap', 'micro_plan'] },
    },
    {
      serviceType: PromptServiceType.simulation,
      version: 1,
      isActive: true,
      templateContent: `You are analyzing how changes to an investor's profile would affect their identity.

Current identity:
<current_identity>
{{CURRENT_IDENTITY}}
</current_identity>

Modified parameters:
<modifications>
{{MODIFICATIONS}}
</modifications>

Analyze the impact and provide:
1. New archetype (may or may not change)
2. New readiness score
3. Score deltas for each sub-score
4. Strategy implications

Respond in JSON format:
{
  "archetype": "string",
  "readiness_score": number,
  "sub_scores": {},
  "radar_data": {},
  "headline_insight": "string",
  "strategy_changes": "string"
}`,
      outputSchema: { type: 'object', required: ['archetype', 'readiness_score'] },
    },
    {
      serviceType: PromptServiceType.insight,
      version: 1,
      isActive: true,
      templateContent: `You are an AI assistant generating personalized investment insights.

Given the investor context:
<context>
{{CONTEXT}}
</context>

Generate relevant insights. Types: progress, contradiction, score_change, milestone, network_alert.

Respond in JSON format:
{
  "insights": [
    {"type": "string", "message": "string", "priority": "high|medium|low"}
  ]
}`,
      outputSchema: { type: 'object', required: ['insights'] },
    },
    {
      serviceType: PromptServiceType.scoring,
      version: 1,
      isActive: true,
      templateContent: `Score the following audit responses on a scale of 0-100.

Audit type: {{AUDIT_TYPE}}
Responses: {{RESPONSES}}

Consider completeness, quality, and consistency of responses.

Respond in JSON format:
{ "score": number, "breakdown": {} }`,
      outputSchema: { type: 'object', required: ['score'] },
    },
    {
      serviceType: PromptServiceType.growth_path_generation,
      version: 1,
      isActive: true,
      templateContent: `You are an expert real estate growth strategist creating a personalized growth path.

Path type: {{PATH_TYPE}}

Investor identity:
<identity>
{{IDENTITY}}
</identity>

Audit data:
<audit_data>
{{AUDIT_DATA}}
</audit_data>

Active V1 strategy context:
<strategy>
{{STRATEGY_CONTEXT}}
</strategy>

Previously generated paths (for continuity):
<prior_paths>
{{PRIOR_PATHS}}
</prior_paths>

{{PATH_SPECIFIC_INSTRUCTIONS}}

Generate a comprehensive growth path with actionable content and prioritized action items.

Respond in JSON format matching this schema:
{{OUTPUT_FORMAT}}`,
      outputSchema: {
        type: 'object',
        required: ['content', 'action_items', 'summary'],
      },
    },
    {
      serviceType: PromptServiceType.cross_path_analysis,
      version: 1,
      isActive: true,
      templateContent: `You are analyzing connections between an investor's growth paths.

Investor identity:
<identity>
{{IDENTITY}}
</identity>

Generated growth paths:
<paths>
{{PATHS}}
</paths>

Identify cross-path connections:
1. Prerequisites: actions in one path that must complete before another path can progress
2. Enabling: actions that accelerate progress in another path
3. Constraints: resource conflicts between paths (time, capital, attention)
4. Conflicts: direct contradictions requiring resolution

For each conflict, provide a specific resolution recommendation.

Also determine the single "Next Best Action" — the one action item across all paths that would unblock the most cross-path progress.

Respond in JSON format:
{
  "links": [
    {
      "type": "prerequisite|enabling|constraint|conflict",
      "source_path_type": "string",
      "source_item_id": "string",
      "source_description": "string",
      "target_path_type": "string",
      "target_item_id": "string",
      "target_description": "string",
      "description": "string",
      "resolution": "string or null"
    }
  ],
  "next_best_action": {
    "action_item_id": "string",
    "path_type": "string",
    "title": "string",
    "reason": "string",
    "cross_path_impact": ["string"]
  }
}`,
      outputSchema: {
        type: 'object',
        required: ['links', 'next_best_action'],
      },
    },
  ];

  for (const template of templates) {
    await prisma.promptTemplate.upsert({
      where: {
        serviceType_version: {
          serviceType: template.serviceType,
          version: template.version,
        },
      },
      update: {
        templateContent: template.templateContent,
        outputSchema: template.outputSchema,
        isActive: template.isActive,
      },
      create: { ...template, publicId: createId() },
    });
  }

  console.warn('Seeded prompt templates.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
