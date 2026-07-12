export async function sendEmail({ to, subject, html: _html }) {
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
  console.log(`[EMAIL] Integrar con nodemailer + SMTP cuando esté configurado`);
}
