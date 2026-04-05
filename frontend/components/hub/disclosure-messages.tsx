export function getDisclosureMessage(completedCount: number, t: (key: string) => string): string {
  if (completedCount <= 0) {
    return t("hub.disclosure.start_first");
  }
  if (completedCount === 1) {
    return t("hub.disclosure.one_complete");
  }
  if (completedCount <= 3) {
    return t("hub.disclosure.partial");
  }
  if (completedCount === 4) {
    return t("hub.disclosure.almost");
  }
  return t("hub.disclosure.complete");
}
