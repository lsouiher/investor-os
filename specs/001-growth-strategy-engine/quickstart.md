# Quickstart: Growth Strategy Engine

**Feature:** 001-growth-strategy-engine
**Extends:** V1 Identity Platform (must be running)

---

## Prerequisites

- V1 Identity Platform fully deployed and running (backend on :3001, frontend on :3000)
- PostgreSQL with V1 schema applied
- All V1 environment variables configured (see V1 quickstart)

---

## Setup

### 1. Apply Schema Changes

```bash
cd backend
npx prisma migrate dev --name add_growth_strategy_engine
```

This creates 3 new tables (`growth_strategies`, `growth_paths`, `export_history`), adds `feature_flags` column to `tenants`, and extends the `PromptServiceType` enum.

### 2. Seed Growth Strategy Prompt Templates

```bash
npx prisma db seed
```

Seeds two new prompt template types:
- `growth_path_generation` — generates path content and action items
- `cross_path_analysis` — generates cross-path links and next best action

### 3. Install New Dependency

```bash
npm install archiver
npm install -D @types/archiver
```

### 4. Enable Feature Flag

For development, enable the growth strategy feature for all tenants:

```sql
UPDATE tenants SET feature_flags = '{"growth_strategy_enabled": true}';
```

Or per-tenant via Prisma Studio or direct SQL:
```sql
UPDATE tenants SET feature_flags = '{"growth_strategy_enabled": true}' WHERE public_id = '<tenant_public_id>';
```

Note: No admin API endpoint for feature flag management exists at MVP. Manage flags via database directly or Prisma Studio (`npx prisma studio`).

---

## Development Patterns

### New Module Structure

```
backend/src/modules/growth/
  routes.ts        # Growth strategy + path + export endpoints
  service.ts       # Business logic: creation, unlock evaluation, progress
  repository.ts    # Prisma queries for growth_strategies, growth_paths, export_history
  types.ts         # GrowthPathType, GrowthPathStatus, path content schemas
  generation.ts    # AI path generation + cross-path analysis
  export.ts        # Markdown export (zip assembly) + PDF extension
  migration.ts     # V3-to-Growth-Strategy data migration
```

### Feature Flag Check Pattern

```typescript
// middleware/featureFlag.ts
export function requireFeatureFlag(flag: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const tenant = await getTenantById(req.user.tenantId);
    if (!tenant.featureFlags?.[flag]) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Resource not found', details: [] }
      });
    }
    next();
  };
}

// Usage in routes
router.get('/growth-strategy', requireFeatureFlag('growth_strategy_enabled'), getGrowthStrategy);
```

### Unlock Evaluation Pattern

```typescript
// Called after task/action-item completion events
async function evaluateUnlocks(userId: number, tenantId: number): Promise<UnlockEvent[]> {
  const strategy = await getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) return [];

  const unlocks: UnlockEvent[] = [];

  for (const path of strategy.paths) {
    if (path.status !== 'locked') continue;

    const shouldUnlock = await checkUnlockCondition(path.pathType, strategy, userId, tenantId);
    if (shouldUnlock) {
      await unlockPath(path.id, 'organic', { trigger: 'auto_evaluation' });
      unlocks.push({ pathType: path.pathType, unlockType: 'organic' });
    }
  }

  return unlocks;
}
```

### Path Generation Pattern

```typescript
// Non-blocking: sets status to 'generating', returns immediately, generates async
async function generatePath(pathId: number, pathType: GrowthPathType): Promise<void> {
  await updatePathStatus(pathId, 'generating');

  try {
    const context = await assemblePathContext(pathId);
    const result = await callAI('growth_path_generation', context, { timeout: 30000 });
    const parsed = parsePathOutput(result, pathType);

    await updatePath(pathId, {
      status: 'generated',
      content: parsed.content,
      actionItems: parsed.actionItems,
      summary: parsed.summary,
      generatedAt: new Date(),
      generationCooldownUntil: new Date(Date.now() + 3600000), // 1 hour
    });

    // Regenerate cross-path links
    await regenerateCrossPathLinks(pathId);
  } catch (error) {
    await updatePathStatus(pathId, 'unlocked'); // Revert on failure
    throw error;
  }
}
```

### Export Assembly Pattern

```typescript
import archiver from 'archiver';

async function generateMarkdownExport(res: Response, userId: number): Promise<void> {
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const identity = await getCurrentIdentity(userId);
  const strategy = await getActiveGrowthStrategy(userId);
  const aiSummary = await generateExportSummary(identity, strategy);

  archive.append(renderEntryPoint(identity, aiSummary), { name: 'investor-identity.md' });
  archive.append(renderIdentityDetail(identity), { name: 'identity-detail.md' });
  archive.append(renderStrategyOverview(strategy), { name: 'growth-strategy-overview.md' });

  for (const path of strategy.paths.filter(p => p.status === 'generated')) {
    archive.append(renderPathFile(path), { name: `paths/${path.pathType}-growth.md` });
  }

  archive.append(renderActionPlan(strategy), { name: 'action-plan.md' });
  await archive.finalize();
}
```

---

## Testing

```bash
# Run all tests
npm test

# Run growth strategy tests only
npm test -- --testPathPattern="modules/growth"

# Key test scenarios:
# - Growth strategy creation after identity synthesis
# - Progressive unlock evaluation (organic + manual)
# - Path generation with AI mocking
# - Cross-path link generation
# - Export zip assembly and freshness detection
# - Feature flag gating (endpoints return 404 when off)
# - V3 backward compatibility (existing strategy endpoints unaffected)
# - Migration idempotency
```

---

## Key Environment Variables (New)

None required beyond V1. The growth strategy uses:
- Existing `ANTHROPIC_API_KEY` for path generation
- Existing `AUDIT_ENCRYPTION_KEY_V*` for sensitive financial data in Income & Capital path
- Feature flag is stored in database, not env vars
