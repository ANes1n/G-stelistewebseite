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

export const rsvpSchema = z
  .object({
    code: z.string().trim().min(1).max(128),
    firstName: nameField,
    lastName: nameField,
    response: z.enum(["komme", "komme_nicht"]),
    over16: z.boolean(),
    over18: z.boolean(),
    note: noteField,
    /** Honeypot — must stay empty */
    website: z.string().max(0).optional().or(z.literal("")),
    turnstileToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.response === "komme" && !data.over16) {
      ctx.addIssue({
        code: "custom",
        path: ["over16"],
        message: "Bitte bestätigen",
      });
    }
  });

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const manageRsvpSchema = z.object({
  token: z.string().trim().min(20).max(128),
  response: z.enum(["komme", "komme_nicht"]),
  note: noteField,
});

export type ManageRsvpInput = z.infer<typeof manageRsvpSchema>;
