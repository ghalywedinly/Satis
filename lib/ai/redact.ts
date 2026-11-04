/**
 * Removes contact details customers sometimes type into comments, before any text leaves for
 * an AI provider: emails, phone numbers (Saudi and international, Western or Arabic-Indic
 * digits) and links. Placeholders keep the sentence readable for the model.
 */
export function redactForAI(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[link]")
    .replace(/(?:\+|00)?[\d٠-٩][\d٠-٩\s().-]{6,}[\d٠-٩]/g, (match) => (match.replace(/\D/g, "").length + (match.match(/[٠-٩]/g)?.length ?? 0) >= 7 ? "[phone]" : match));
}
