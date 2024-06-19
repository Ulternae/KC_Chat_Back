import z, { object } from 'zod';

const validLanguages = ["en", "es", "gl"];
const validThemes = ["darkMode", "lightMode"];

const settingsSchema = z.object({
  language: z.string().transform((val) => validLanguages.includes(val) ? val : "en").default("en"),
  theme: z.string().transform((val) => validThemes.includes(val) ? val : "darkMode").default("darkMode")
});

const validateSettings = (object) => {
  return settingsSchema.safeParse(object)
}

const partialValidateSettings = (object) => {
  return settingsSchema.partial().safeParse(object)
}

export { validateSettings, partialValidateSettings }