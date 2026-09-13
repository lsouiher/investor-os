import Link from "next/link";

const CONTACT = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "";
const EFFECTIVE = "September 2026";

// Plain English on purpose: this is what beta users are agreeing to, and it should be
// readable on a phone in two minutes. English only for the beta.
export default function TermsPage() {
  return (
    <div className="flex-1 bg-background px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-widest uppercase text-accent">InvestorOS</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Beta terms &amp; privacy</h1>
        <p className="mt-1 text-sm text-foreground-muted">Effective {EFFECTIVE}</p>

        <Section title="What this is">
          <p>
            InvestorOS is a planning tool for real estate investors, in beta. You answer five short
            audits about your finances, time, skills, risk and goals; it builds an investor identity
            (an archetype and a readiness score), suggests strategies that fit, and lays out plans.
            It is free during the beta. Features will change, some say &ldquo;Coming Soon&rdquo;, and you
            will find rough edges. Tell us about them.
          </p>
        </Section>

        <Section title="Not financial, legal or tax advice">
          <p>
            Everything InvestorOS produces is generated from your own answers to help you think. It
            is not financial, investment, legal or tax advice, it does not know your full situation,
            and it can be wrong. Check any decision with a licensed professional before you act on
            it. You are responsible for your investments.
          </p>
        </Section>

        <Section title="What we store">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your email and a hashed password (we never see the password itself).</li>
            <li>
              Your audit answers. The sensitive ones (income, assets, debts, credit range, tax rate)
              are encrypted at rest with AES-256-GCM.
            </li>
            <li>The identities, strategies, plans and simulations generated for you.</li>
            <li>Contacts and tasks you add, and how you use the app (which pages, what you complete).</li>
            <li>Where you signed up from (for example, the conference link) so we know what worked.</li>
          </ul>
          <p className="mt-3">
            You can use approximate numbers. The results are about proportions, not cents.
          </p>
        </Section>

        <Section title="How the AI part works">
          <p>
            To generate your identity, strategies, plans and insights, your audit answers and app
            data are sent to Anthropic&rsquo;s Claude API. Anthropic does not use API inputs to train
            its models. We keep a log of those requests to debug and improve the prompts; the log
            is encrypted the same way as your audit answers.
          </p>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc space-y-1 pl-5">
            <li>We don&rsquo;t sell or rent your data, and there are no ads.</li>
            <li>We don&rsquo;t share it with anyone except the service providers that run the app (hosting, database, email, the AI API).</li>
            <li>We don&rsquo;t email you except about your account (password resets) and, if you signed up through the beta, about the beta itself. Every such email has a way to stop them.</li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            Ask and it&rsquo;s gone: email {CONTACT ? <a className="text-accent underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> : "the address in the app footer"} from the
            address on your account. We erase your audit answers and generated results right away
            and deactivate the account; backups roll off within 30 days.
          </p>
        </Section>

        <Section title="Security, and what beta means">
          <p>
            Traffic is encrypted (HTTPS), passwords are hashed, sensitive fields are encrypted, and
            access is isolated per account. It is still beta software run by a small team: don&rsquo;t
            enter anything you couldn&rsquo;t stand to have exposed, and use a password you don&rsquo;t use
            elsewhere. If we find a problem that affects your data, we will tell you.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            We may update these terms as the beta evolves; the effective date above changes when we
            do. Questions, feedback, deletion requests:{" "}
            {CONTACT ? <a className="text-accent underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> : "use the feedback link in the app"}.
          </p>
        </Section>

        <p className="mt-10 text-sm text-foreground-muted">
          <Link href="/" className="text-accent underline underline-offset-2">Back to InvestorOS</Link>
        </p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 text-sm leading-relaxed text-foreground-secondary">
      <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
