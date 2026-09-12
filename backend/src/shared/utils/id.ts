import { createId } from '@paralleldrive/cuid2';

export function generatePublicId(): string {
  return createId();
}
