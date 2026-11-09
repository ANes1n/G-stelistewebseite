import { z } from "zod";

const HTML_PATTERN = /[<>]|&#|javascript:/i;

function rejectHtml(value: string, ctx: z.RefinementCtx) {
  if (HTML_PATTERN.test(value)) {
    ctx.addIssue({
      code: "custom",
      message: "Ungültige Zeichen",
    });
  }
}

const nameField = z
  .string()
  .trim()
  .min(1, "Pflichtfeld")
  .max(80, "Zu lang")
  .superRefine(rejectHtml);

const noteField = z
  .string()
  .trim()
  .max(200, "Max. 200 Zeichen")
  .superRefine(rejectHtml)
  .optional();

export const rsvpSchema = z.object({
  code: z.string().trim().min(1).max(128),
  firstName: nameField,
  lastName: nameField,
  ageGroup: z.enum(["u16", "16_17", "18_plus"]),
  note: noteField,
  /** Honeypot — must stay empty */
  website: z.string().max(0).optional().or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const manageRsvpSchema = z.object({
  token: z.string().trim().min(20).max(128),
  action: z.enum(["withdraw", "reregister", "note"]),
  note: noteField,
});

export type ManageRsvpInput = z.infer<typeof manageRsvpSchema>;

export const eventInfoSchema = z.object({
  party_name: z.string().trim().min(1).max(120).superRefine(rejectHtml),
  tagline: z.string().trim().max(200).superRefine(rejectHtml),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  time_label: z.string().trim().max(200).superRefine(rejectHtml),
  time_label_override: z.boolean(),
  place_name: z.string().trim().max(160).superRefine(rejectHtml),
  place_street: z.string().trim().max(160).superRefine(rejectHtml),
  place_city: z.string().trim().max(160).superRefine(rejectHtml),
  place_notes: z.string().trim().max(300).superRefine(rejectHtml),
  dress_code: z.string().trim().max(200).superRefine(rejectHtml),
  age_info: z.string().trim().max(300).superRefine(rejectHtml),
  rsvp_hint: z.string().trim().max(300).superRefine(rejectHtml),
  contact_name: z.string().trim().max(120).superRefine(rejectHtml),
  contact_phone: z.string().trim().max(60).superRefine(rejectHtml),
  contact_email: z.string().trim().max(120).superRefine(rejectHtml),
  extra_info: z.string().trim().max(1000).superRefine(rejectHtml),
  calendar_summary: z.string().trim().max(160).superRefine(rejectHtml),
  calendar_description: z.string().trim().max(500).superRefine(rejectHtml),
});
