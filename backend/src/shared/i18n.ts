// Text the server writes, in both languages, and how the server reads a language off a
// request. The frontend has its own dictionaries (frontend/locales); this one covers what is
// rendered here: error messages, rate-limit messages and the sentences the system composes
// (unlock criteria, cooldowns, staleness reasons), and later the email, the PDF and the export.
//
// French follows the interface conventions: formal "vous", a non-breaking space ( )
// before : ; ? ! %, typographic apostrophes.

export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the language for an `Accept-Language` header: the supported language the client
 * prefers most (highest q-value, header order on ties). Any regional French (`fr-CA`,
 * `fr-FR`) is French. Nothing supported, or no header: English.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const preferences = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const quality = q ? Number(q.slice(2)) : 1;
      return { language: tag.trim().toLowerCase().split('-')[0], quality, index };
    })
    .filter((p) => p.quality > 0) // q=0 means "not acceptable"; NaN (malformed) drops out too
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { language } of preferences) {
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

// Keys are grouped by module. English is the text the API returned before it spoke French:
// changing one changes what English-language users read.
export const en = {
  'error.internal': 'An unexpected error occurred.',

  'rate_limit.general': 'Too many requests. Please try again later.',
  'rate_limit.login': 'Too many login attempts. Please try again later.',
  'rate_limit.forgot_password': 'Too many password reset requests. Please try again later.',
  'rate_limit.reset_password': 'Too many password reset attempts. Please try again later.',
  'rate_limit.synthesis': 'Too many synthesis requests. Please try again later.',
  'rate_limit.strategy': 'Too many strategy generation requests. Please try again later.',
  'rate_limit.blueprint': 'Too many blueprint requests. Please try again later.',

  'validation.locale_invalid': 'Invalid language.',
  'validation.locale_options': 'Must be one of: {{locales}}.',
  'validation.body_invalid_json': 'The request body is not valid JSON.',
  'validation.body_too_large': 'The request body is too large.',
  'validation.body_unreadable': 'The request body could not be read.',

  'auth.required': 'Authentication required.',
  'auth.token_payload_invalid': 'Invalid token payload.',
  'auth.token_invalidated': 'Token has been invalidated. Please log in again.',
  'auth.token_invalid': 'Invalid or expired token.',
  'auth.user_not_found': 'User not found.',
  'auth.email_invalid': 'Invalid email format.',
  'auth.email_invalid_detail': 'Must be a valid email address.',
  'auth.password_too_short': 'Password too short.',
  'auth.password_min_detail': 'Must be at least {{min}} characters.',
  'auth.password_too_long': 'Password too long.',
  'auth.password_max_detail': 'Must be at most {{max}} characters.',
  'auth.reset_token_required': 'Reset token is required.',
  'auth.reset_token_invalid': 'Invalid or expired reset token.',
  'auth.email_taken': 'Email already registered.',
  'auth.invalid_credentials': 'Invalid email or password.',
  'auth.forgot_password_sent': 'If an account exists, a reset email has been sent.',
  'auth.password_reset_done': 'Password has been reset.',

  'audit.sections_incomplete': 'All required sections must have at least one field completed.',
  'audit.type.financial': 'financial',
  'audit.type.time': 'time',
  'audit.type.skills': 'skills',
  'audit.type.risk': 'risk',
  'audit.type.horizon': 'horizon',

  'identity.not_found': 'No identity found. Complete your audits first.',
  'identity.audit_required': 'At least one audit must be completed before identity synthesis.',
  'identity.rating_range': 'Rating must be an integer between 1 and 5.',
  'identity.feedback_too_long': 'Feedback must be at most 2000 characters.',
  'identity.version_not_found': 'Identity version not found.',

  'strategy.identity_required': 'Identity must be synthesized before generating strategies.',
  'strategy.ai_wrong_count': 'AI did not return exactly 3 strategies. Please try again.',
  'strategy.not_found': 'Strategy not found.',
  'strategy.forbidden': 'You do not have access to this strategy.',
  'strategy.action_item_not_found': 'action-item not found.',
  'strategy.milestone_not_found': 'milestone not found.',
  'strategy.micro_task_not_found': 'micro-task not found.',

  'simulation.daily_limit': 'Maximum {{max}} simulations per 24 hours. Please try again later.',
  'simulation.identity_required': 'No identity profile found. Complete all 5 audits and synthesize your identity first.',
  'simulation.config_identity_required': 'No identity profile found. Complete your audits first.',
  'simulation.job_not_found': 'Simulation not found. Please run it again.',

  'blueprint.audits_required': 'All 5 audits must be completed before generating a blueprint. Missing: {{missing}}.',
  'blueprint.identity_required': 'No identity profile found. Synthesize your identity before generating a blueprint.',

  'contact.not_found': 'Contact not found.',
  'contact.name_required': 'name is required.',

  'task.not_found': 'Task not found.',
  'task.title_required': 'title is required.',

  'ai.unavailable': "We couldn't process your request right now. Please try again.",
  'ai.parse_failed': 'Failed to parse AI response as JSON. Please try again.',

  'path.portfolio': 'Portfolio Growth',
  'path.income_capital': 'Income & Capital',
  'path.skills_knowledge': 'Skills & Knowledge',
  'path.time_operations': 'Time & Operations',

  'growth.identity_required': 'Complete your investor identity before creating a growth strategy.',
  'growth.already_exists': 'Active growth strategy already exists.',
  'growth.not_found': 'No growth strategy found.',
  'growth.not_found_identity_first': 'No growth strategy found. Complete your investor identity first.',
  'growth.no_active_strategy': 'No active growth strategy found.',
  'growth.path_not_found': 'Growth path not found.',
  'growth.path_not_generated': 'Growth path not found or not yet generated.',
  'growth.path_already_generating': 'This path is already being generated.',
  'growth.path_must_be_generated': 'Path must be generated before it can be regenerated.',
  'growth.coming_soon_generate': '{{path}} is coming soon and not yet available for generation.',
  'growth.coming_soon_regenerate': '{{path}} is coming soon and cannot be regenerated.',
  'growth.generation_unavailable': 'Generation service temporarily unavailable. Please try again.',
  'growth.unlock_criteria.income_capital': 'Complete 2+ micro-plan tasks from Portfolio Growth',
  'growth.unlock_criteria.coming_soon': 'Coming soon — this path will be available in a future update',
  'growth.unlock_criteria.default': 'meeting unlock criteria',
  'growth.early_unlock': 'This path is most valuable after {{criteria}}. Set confirm_early_unlock to true to generate now.',
  'growth.cooldown_generate': 'This path was recently generated. Try again in {{minutes}} min.',
  'growth.cooldown_regenerate': 'Regeneration available in {{minutes}} min.',
  'growth.unlocked': "You've unlocked {{path}}!",
  'growth.staleness.identity_updated': 'Identity updated (v{{from}} → v{{to}})',
  'growth.staleness.path_regenerated': '{{path}} path regenerated (v{{from}} → v{{to}})',

  'export.identity_required': 'Complete your investor identity before exporting.',
  'export.consent_required': 'Export consent is required. This export may include sensitive financial data.',
  'export.staleness.identity_updated': 'Identity updated (v{{from}} -> v{{to}})',
  'export.staleness.path_regenerated': '{{path}} regenerated (v{{from}} -> v{{to}})',

  'insight.get_started.title': 'Get Started',
  'insight.get_started.message': 'Complete all 5 audits to unlock your investor identity and personalized insights.',
};

export type MessageKey = keyof typeof en;

// Typed against the English keys: a key missing here does not compile
export const fr: Record<MessageKey, string> = {
  'error.internal': 'Une erreur inattendue est survenue.',

  'rate_limit.general': 'Trop de requêtes. Veuillez réessayer plus tard.',
  'rate_limit.login': 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  'rate_limit.forgot_password': 'Trop de demandes de réinitialisation du mot de passe. Veuillez réessayer plus tard.',
  'rate_limit.reset_password': 'Trop de tentatives de réinitialisation du mot de passe. Veuillez réessayer plus tard.',
  'rate_limit.synthesis': 'Trop de demandes de synthèse. Veuillez réessayer plus tard.',
  'rate_limit.strategy': 'Trop de demandes de génération de stratégies. Veuillez réessayer plus tard.',
  'rate_limit.blueprint': 'Trop de demandes de blueprint. Veuillez réessayer plus tard.',

  'validation.locale_invalid': 'Langue non valide.',
  'validation.body_invalid_json': 'Le corps de la requête n’est pas un JSON valide.',
  'validation.body_too_large': 'Le corps de la requête est trop volumineux.',
  'validation.body_unreadable': 'Le corps de la requête n’a pas pu être lu.',
  'validation.locale_options': 'Doit être l’une des valeurs suivantes : {{locales}}.',

  'auth.required': 'Authentification requise.',
  'auth.token_payload_invalid': 'Session non valide.',
  'auth.token_invalidated': 'Votre session n’est plus valide. Veuillez vous reconnecter.',
  'auth.token_invalid': 'Session non valide ou expirée.',
  'auth.user_not_found': 'Utilisateur introuvable.',
  'auth.email_invalid': 'Format de courriel non valide.',
  'auth.email_invalid_detail': 'Doit être une adresse courriel valide.',
  'auth.password_too_short': 'Mot de passe trop court.',
  'auth.password_min_detail': 'Doit contenir au moins {{min}} caractères.',
  'auth.password_too_long': 'Mot de passe trop long.',
  'auth.password_max_detail': 'Doit contenir au plus {{max}} caractères.',
  'auth.reset_token_required': 'Le lien de réinitialisation est incomplet.',
  'auth.reset_token_invalid': 'Lien de réinitialisation non valide ou expiré.',
  'auth.email_taken': 'Ce courriel est déjà associé à un compte.',
  'auth.invalid_credentials': 'Courriel ou mot de passe incorrect.',
  'auth.forgot_password_sent': 'Si un compte existe, un courriel de réinitialisation a été envoyé.',
  'auth.password_reset_done': 'Le mot de passe a été réinitialisé.',

  'audit.sections_incomplete': 'Chaque section obligatoire doit contenir au moins une réponse.',
  'audit.type.financial': 'finances',
  'audit.type.time': 'temps',
  'audit.type.skills': 'compétences',
  'audit.type.risk': 'risque',
  'audit.type.horizon': 'horizon',

  'identity.not_found': 'Aucune identité trouvée. Complétez d’abord vos audits.',
  'identity.audit_required': 'Au moins un audit doit être complété avant la synthèse de l’identité.',
  'identity.rating_range': 'La note doit être un nombre entier de 1 à 5.',
  'identity.feedback_too_long': 'Le commentaire ne doit pas dépasser 2 000 caractères.',
  'identity.version_not_found': 'Version d’identité introuvable.',

  'strategy.identity_required': 'L’identité doit être synthétisée avant de générer des stratégies.',
  'strategy.ai_wrong_count': 'L’IA n’a pas renvoyé exactement 3 stratégies. Veuillez réessayer.',
  'strategy.not_found': 'Stratégie introuvable.',
  'strategy.forbidden': 'Vous n’avez pas accès à cette stratégie.',
  'strategy.action_item_not_found': 'Élément d’action introuvable.',
  'strategy.milestone_not_found': 'Jalon introuvable.',
  'strategy.micro_task_not_found': 'Micro-tâche introuvable.',

  'simulation.daily_limit': 'Maximum de {{max}} simulations par période de 24 heures. Veuillez réessayer plus tard.',
  'simulation.identity_required': 'Aucun profil d’identité trouvé. Complétez d’abord les 5 audits et synthétisez votre identité.',
  'simulation.config_identity_required': 'Aucun profil d’identité trouvé. Complétez d’abord vos audits.',
  'simulation.job_not_found': 'Simulation introuvable. Veuillez la relancer.',

  'blueprint.audits_required': 'Les 5 audits doivent être complétés avant de générer un blueprint. Il manque : {{missing}}.',
  'blueprint.identity_required': 'Aucun profil d’identité trouvé. Synthétisez votre identité avant de générer un blueprint.',

  'contact.not_found': 'Contact introuvable.',
  'contact.name_required': 'Le nom est obligatoire.',

  'task.not_found': 'Tâche introuvable.',
  'task.title_required': 'Le titre est obligatoire.',

  'ai.unavailable': 'Nous n’avons pas pu traiter votre demande pour le moment. Veuillez réessayer.',
  'ai.parse_failed': 'La réponse de l’IA n’a pas pu être lue. Veuillez réessayer.',

  'path.portfolio': 'Croissance du portefeuille',
  'path.income_capital': 'Revenus et capital',
  'path.skills_knowledge': 'Compétences et connaissances',
  'path.time_operations': 'Temps et opérations',

  'growth.identity_required': 'Complétez votre identité d’investisseur avant de créer une stratégie de croissance.',
  'growth.already_exists': 'Une stratégie de croissance active existe déjà.',
  'growth.not_found': 'Aucune stratégie de croissance trouvée.',
  'growth.not_found_identity_first': 'Aucune stratégie de croissance trouvée. Complétez d’abord votre identité d’investisseur.',
  'growth.no_active_strategy': 'Aucune stratégie de croissance active.',
  'growth.path_not_found': 'Parcours de croissance introuvable.',
  'growth.path_not_generated': 'Parcours de croissance introuvable ou pas encore généré.',
  'growth.path_already_generating': 'Ce parcours est déjà en cours de génération.',
  'growth.path_must_be_generated': 'Le parcours doit être généré avant de pouvoir être régénéré.',
  'growth.coming_soon_generate': '{{path}} : bientôt disponible. Ce parcours ne peut pas encore être généré.',
  'growth.coming_soon_regenerate': '{{path}} : bientôt disponible. Ce parcours ne peut pas être régénéré.',
  'growth.generation_unavailable': 'Le service de génération est temporairement indisponible. Veuillez réessayer.',
  'growth.unlock_criteria.income_capital': 'Compléter au moins 2 tâches du micro-plan de Croissance du portefeuille',
  'growth.unlock_criteria.coming_soon': 'Bientôt disponible : ce parcours arrivera dans une prochaine mise à jour',
  'growth.unlock_criteria.default': 'Remplir les critères de déblocage',
  'growth.early_unlock': 'Ce parcours est plus utile après l’étape suivante : {{criteria}}. Confirmez le déblocage anticipé pour le générer maintenant.',
  'growth.cooldown_generate': 'Ce parcours vient d’être généré. Réessayez dans {{minutes}} min.',
  'growth.cooldown_regenerate': 'Régénération possible dans {{minutes}} min.',
  'growth.unlocked': 'Vous avez débloqué {{path}} !',
  'growth.staleness.identity_updated': 'Identité mise à jour (v{{from}} → v{{to}})',
  'growth.staleness.path_regenerated': '{{path}} : parcours régénéré (v{{from}} → v{{to}})',

  'export.identity_required': 'Complétez votre identité d’investisseur avant d’exporter.',
  'export.consent_required': 'Votre consentement est requis pour exporter. Cet export peut contenir des données financières sensibles.',
  'export.staleness.identity_updated': 'Identité mise à jour (v{{from}} → v{{to}})',
  'export.staleness.path_regenerated': '{{path}} : parcours régénéré (v{{from}} → v{{to}})',

  'insight.get_started.title': 'Pour commencer',
  'insight.get_started.message': 'Complétez les 5 audits pour débloquer votre identité d’investisseur et des insights personnalisés.',
};

/**
 * A message named by its key instead of written out, so it can be rendered later in the
 * language of whoever reads it: an error raised deep in a service, or one kept for a
 * request that polls for it.
 */
export interface LocalizedText {
  key: MessageKey;
  params?: MessageParams;
}

// A parameter can itself be a message (a path name inside a sentence), or a list of them
export type MessageParams = Record<string, string | number | LocalizedText | LocalizedText[]>;

export function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as LocalizedText).key === 'string' &&
    Object.hasOwn(en, (value as LocalizedText).key) // own keys only: not toString, constructor...
  );
}

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, fr };

/** Renders a message in the given language, filling `{{param}}` placeholders. */
export function t(locale: Locale, key: MessageKey, params: MessageParams = {}): string {
  return dictionaries[locale][key].replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => {
    if (!(name in params)) return placeholder;
    const value = params[name];
    if (Array.isArray(value)) return value.map((item) => render(locale, item)).join(', ');
    return typeof value === 'object' ? render(locale, value) : String(value);
  });
}

/** Renders a keyed message in the given language; text that is already written passes through. */
export function render(locale: Locale, text: LocalizedText | string): string {
  return typeof text === 'string' ? text : t(locale, text.key, text.params);
}
