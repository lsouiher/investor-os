export function getDisclosureMessage(completedCount: number): string {
  if (completedCount <= 0) {
    return "Start your first audit to begin building your investor identity.";
  }
  if (completedCount === 1) {
    return "Getting to know you...";
  }
  if (completedCount <= 3) {
    return "Partial profile, add more for sharper insights.";
  }
  if (completedCount === 4) {
    return "Almost there, one more for full identity.";
  }
  return "Full identity unlocked.";
}
