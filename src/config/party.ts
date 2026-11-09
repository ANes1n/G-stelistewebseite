/**
 * Alle Party-Texte an einem Ort.
 * Platzhalter mit [TODO] oder Beispielwerten ersetzen, bevor du live gehst.
 */
export const party = {
  /** Kurzname / Branding */
  brandName: "[TODO: Party-Name]",

  /** Seitentitel / Hero */
  title: "Einladung",

  /** Unterzeile unter dem Titel */
  subtitle: "[TODO: Kurze Einladungstext-Zeile]",

  /** Datum der Feier */
  dateLabel: "22.12.2026 bis 23.12.2026",

  /** Start-/Endzeit (Abend bis Folgetag) */
  timeLabel: "[TODO: z. B. ab 20:00 Uhr bis in den Morgen]",

  /** Ort / Adresse */
  place: {
    name: "[TODO: Location-Name]",
    address: "[TODO: Straße Nr., PLZ Ort]",
    notes: "[TODO: z. B. Klingel, Anfahrtshinweis]",
  },

  /** Dresscode */
  dressCode: "[TODO: Dresscode]",

  /** Altersinfo (kein Geburtsdatum im Formular) */
  ageInfo: "[TODO: z. B. Ab 16 Jahren willkommen; ab 18 ohne Begleitung]",

  /** RSVP-Frist (Anzeige; harte Deadline liegt in der DB-Einstellung) */
  rsvpDeadlineLabel: "[TODO: z. B. Bitte bis zum 10.12.2026 zusagen]",

  /** Kontakt für Rückfragen */
  contact: {
    name: "[TODO: Kontaktname]",
    phone: "[TODO: Telefon]",
    email: "[TODO: E-Mail]",
  },

  /** Kalender (.ics) */
  calendar: {
    summary: "[TODO: Kalendertitel]",
    description: "[TODO: Kurze Beschreibung für den Kalendereintrag]",
    /** ISO-ähnlich lokal: Start Abend 22.12.2026 */
    start: "20261222T200000",
    /** Ende am 23.12.2026 Vormittag */
    end: "20261223T060000",
    location: "[TODO: Location für Kalender]",
  },

  /** Datenschutz-Hinweis (kurz) */
  privacyNote:
    "Deine Angaben dienen ausschließlich der Gästeplanung. Nach der Feier werden sie gelöscht. Es gibt keine öffentliche Gästeliste.",

  /** Meta (noindex sowieso) */
  metaDescription: "Private Einladung",
} as const;

export type PartyConfig = typeof party;
