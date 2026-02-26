const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
} = process.env;

const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
const smtpConnectionTimeoutMs = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 8000;
const smtpGreetingTimeoutMs = Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 5000;
const smtpSocketTimeoutMs = Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 10000;

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: smtpConnectionTimeoutMs,
      greetingTimeout: smtpGreetingTimeoutMs,
      socketTimeout: smtpSocketTimeoutMs,
    })
  : null;

const isEmailConfigured = Boolean(transporter);

const purposeLabels = {
  register: 'Verify your account',
  login: 'Your login code',
  reset: 'Reset your password',
};

const sendOtpEmail = async ({ to, code, purpose, expiresAt }) => {
  const subject = purposeLabels[purpose] || 'Your verification code';
  const minutesLeft = Math.max(
    1,
    Math.round((expiresAt.getTime() - Date.now()) / 60000)
  );
  const text = [
    `Your ${subject.toLowerCase()} is: ${code}`,
    `It expires in ${minutesLeft} minute(s).`,
    'If you did not request this code, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="margin-bottom: 8px;">${subject}</h2>
      <p>Your one-time code is:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">
        ${code}
      </div>
      <p>This code expires in ${minutesLeft} minute(s).</p>
      <p style="font-size: 12px; color: #555;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  if (!transporter) {
    throw new Error('SMTP email service not configured');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`Sending OTP email via SMTP to ${to}`);
  }

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendOtpEmail, isEmailConfigured };
