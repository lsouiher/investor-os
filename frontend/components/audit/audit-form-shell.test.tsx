import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import AuditFormShell, { type AuditSection } from "./audit-form-shell";

// Two sections of the real skills audit, so the texts come from the real dictionaries.
// French puts a non-breaking space before a colon. getByText reads it as a plain space; an
// accessible name keeps it, so those are matched with a pattern.
const sections: AuditSection[] = [
  {
    id: "re_experience",
    fields: [
      { name: "deals_closed", type: "select", required: true, options: ["0", "1-2", "3-5"] },
      { name: "biggest_success", type: "textarea" },
    ],
  },
  {
    id: "professional",
    fields: [
      { name: "profession", type: "text", required: true },
      { name: "negotiation_skill", type: "select", options: ["beginner", "expert"] },
    ],
  },
];

function SwitchTo({ locale }: { locale: Locale }) {
  const { setLocale } = useTranslation();
  return (
    <button type="button" aria-label="switch-language" onClick={() => setLocale(locale)} />
  );
}

function renderShell(initialLocale: Locale = "fr") {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onComplete = jest.fn().mockResolvedValue(undefined);
  render(
    <I18nProvider initialLocale={initialLocale}>
      <SwitchTo locale={initialLocale === "fr" ? "en" : "fr"} />
      <AuditFormShell
        auditType="skills"
        sections={sections}
        initialData={{}}
        onSave={onSave}
        onComplete={onComplete}
      />
    </I18nProvider>
  );
  return { onSave, onComplete, user: userEvent.setup() };
}

describe("AuditFormShell", () => {
  it("renders the title, sections, questions, choices and navigation in French", () => {
    renderShell("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Compétences et expérience" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Expérience en immobilier" })).toBeInTheDocument();
    expect(screen.getByText("Section 1 sur 2")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de transactions immobilières conclues/)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sélectionner..." })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1 à 2 transactions" })).toHaveValue("1-2");
    expect(screen.getByPlaceholderText(/Décrivez brièvement votre expérience immobilière/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retour" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Suivant\s: Parcours professionnel$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mode formulaire" })).toBeDisabled();
  });

  it("renders the same form in English", () => {
    renderShell("en");

    expect(screen.getByRole("heading", { level: 1, name: "Skills & Experience" })).toBeInTheDocument();
    expect(screen.getByText("Section 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of RE deals closed/)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1-2 deals" })).toHaveValue("1-2");
    expect(screen.getByRole("button", { name: "Next: Professional Background" })).toBeInTheDocument();
  });

  it("keeps every answer when the language changes mid-form", async () => {
    const { user } = renderShell("fr");

    await user.selectOptions(screen.getByLabelText(/Nombre de transactions/), "1 à 2 transactions");
    await user.type(screen.getByLabelText(/Plus grande réussite/), "Un duplex à Montréal");

    await user.click(screen.getByRole("button", { name: "switch-language" }));

    expect(screen.getByLabelText(/Number of RE deals closed/)).toHaveValue("1-2");
    expect(screen.getByRole<HTMLOptionElement>("option", { name: "1-2 deals" }).selected).toBe(true);
    expect(screen.getByLabelText(/Biggest RE success/)).toHaveValue("Un duplex à Montréal");
    expect(screen.queryByText(/Nombre de transactions/)).not.toBeInTheDocument();
  });

  it("explains a missing required answer in the current language, and follows a switch", async () => {
    const { user, onSave } = renderShell("fr");

    await user.click(screen.getByRole("button", { name: /Suivant/ }));

    expect(
      screen.getByText("Champ obligatoire : Nombre de transactions immobilières conclues")
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Section 1 sur 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "switch-language" }));

    expect(screen.getByText("Number of RE deals closed is required")).toBeInTheDocument();
  });

  it("sends the option codes, not the labels, whatever the language", async () => {
    const { user, onSave, onComplete } = renderShell("fr");

    await user.selectOptions(screen.getByLabelText(/Nombre de transactions/), "3 à 5 transactions");
    await user.click(screen.getByRole("button", { name: /Suivant/ }));

    expect(onSave).toHaveBeenCalledWith({ re_experience: { deals_closed: "3-5" } });

    await user.type(await screen.findByLabelText(/Profession ou secteur/), "Infirmière");
    await user.selectOptions(screen.getByLabelText(/Niveau en négociation/), "Expert (négociateur professionnel)");
    await user.click(screen.getByRole("button", { name: "Terminer l’audit" }));

    expect(onComplete).toHaveBeenCalledWith({
      re_experience: { deals_closed: "3-5" },
      professional: { profession: "Infirmière", negotiation_skill: "expert" },
    });
  });
});
