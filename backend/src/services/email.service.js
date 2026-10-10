import { DEFAULT_LOCALE, resolveLocale, t } from "../i18n/index.js";

/**
 * @param {{ to: string, subject?: string, subjectKey?: string, subjectParams?: Record<string, string>, html?: string, locale?: string | null, acceptLanguage?: string }} opts
 */
export async function sendEmail({
  to,
  subject,
  subjectKey,
  subjectParams = {},
  html: _html,
  locale,
  acceptLanguage,
}) {
  const resolved = resolveLocale({ userLocale: locale, acceptLanguage });
  const finalSubject =
    subjectKey != null
      ? t(`email.${subjectKey}`, resolved, subjectParams)
      : subject ?? t("email.defaultSubject", resolved);

  console.log(`[EMAIL] To: ${to} | Subject: ${finalSubject} | locale: ${resolved || DEFAULT_LOCALE}`);
  console.log(`[EMAIL] Integrar con nodemailer + SMTP cuando esté configurado`);
}
