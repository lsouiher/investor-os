// Data access for deals sent from RECS (contracts/recs-deals-api.md). The import page and the
// hub section call these and render; they never call api themselves (constitution III).
import { api } from "./api-client";
import type { RecsImport } from "./recs-import";

export interface RecsDeal {
  id: string;
  c: string;
  name: string;
  d: string;
  created_at: string;
}

export function saveRecsDeal(deal: RecsImport) {
  return api.post<Omit<RecsDeal, "d">>("/recs-deals", { c: deal.c, name: deal.name, d: deal.d });
}

export function listRecsDeals() {
  return api.get<RecsDeal[]>("/recs-deals");
}

export function deleteRecsDeal(id: string) {
  return api.del<void>(`/recs-deals/${encodeURIComponent(id)}`);
}
