export type EventInfo = {
  id: number;
  party_name: string;
  tagline: string;
  starts_at: string;
  ends_at: string;
  time_label: string;
  time_label_override: boolean;
  place_name: string;
  place_street: string;
  place_city: string;
  place_notes: string;
  dress_code: string;
  age_info: string;
  rsvp_hint: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  extra_info: string;
  calendar_summary: string;
  calendar_description: string;
};

export const DEFAULT_EVENT_INFO: EventInfo = {
  id: 1,
  party_name: "Geburtstagsparty",
  tagline: "Du bist eingeladen",
  starts_at: "2026-12-22T19:00:00.000Z",
  ends_at: "2026-12-23T05:00:00.000Z",
  time_label: "ab 20:00 Uhr bis in den Morgen",
  time_label_override: true,
  place_name: "",
  place_street: "",
  place_city: "",
  place_notes: "",
  dress_code: "",
  age_info: "Bitte gib deine Altersgruppe an.",
  rsvp_hint: "Bitte bis Anfang Dezember anmelden.",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  extra_info: "",
  calendar_summary: "Geburtstagsparty",
  calendar_description:
    "Private Feier — Details folgen über deine Einladung.",
};
