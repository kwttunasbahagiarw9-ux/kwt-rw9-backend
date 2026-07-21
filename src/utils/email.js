import nodemailer from 'nodemailer';

const createTransporter = () => {
  const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;

  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    return null;
  }

  const password = SMTP_PASSWORD.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: SMTP_EMAIL,
      pass: password
    }
  });
};

export const sendResetEmail = async (to, fullName, resetLink) => {
  const transporter = createTransporter();

  if (!transporter) {
    const error = new Error('SMTP belum dikonfigurasi. Hubungi pengelola.');
    error.statusCode = 500;
    throw error;
  }

  await transporter.sendMail({
    from: `"KWT RW 9" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Atur Ulang Password - KWT RW 9 Tanjung Mas',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #14532d;">Atur Ulang Password</h2>
        <p>Halo <strong>${fullName}</strong>,</p>
        <p>Kami menerima permintaan atur ulang password untuk akun KWT RW 9 Anda.</p>
        <p>Klik tombol di bawah untuk membuat password baru:</p>
        <a href="${resetLink}"
           style="display: inline-block; padding: 12px 28px; margin: 16px 0;
                  background: #1a6b3c; color: #fff; text-decoration: none;
                  border-radius: 10px; font-weight: 600;">
          Atur Ulang Password
        </a>
        <p style="color: #64748b; font-size: 0.85rem;">
          Tautan ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta atur ulang password.
        </p>
      </div>
    `
  });
};
