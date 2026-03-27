const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, service, message, website, _loaded } = req.body || {};

  // Server-side honeypot check
  if (website) {
    return res.status(200).json({ ok: true });
  }

  // Server-side timing check (submitted in under 5 seconds)
  if (_loaded && Date.now() - Number(_loaded) < 5000) {
    return res.status(200).json({ ok: true });
  }

  // Validate required fields
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Name is required (at least 2 characters).' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!message || String(message).trim().length < 10) {
    return res.status(400).json({ error: 'Message is required (at least 10 characters).' });
  }

  const sanitise = (v) => String(v || '').trim();
  const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const nameVal = sanitise(name);
  const emailVal = sanitise(email);
  const phoneVal = sanitise(phone);
  const serviceVal = sanitise(service);
  const messageVal = sanitise(message);

  const htmlBody = `
    <h2>New Website Enquiry</h2>
    <table style="border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name</td><td>${escHtml(nameVal)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td><a href="mailto:${escHtml(emailVal)}">${escHtml(emailVal)}</a></td></tr>
      ${phoneVal ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone</td><td>${escHtml(phoneVal)}</td></tr>` : ''}
      ${serviceVal ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Service</td><td>${escHtml(serviceVal)}</td></tr>` : ''}
    </table>
    <h3>Message</h3>
    <p>${escHtml(messageVal).replace(/\n/g, '<br>')}</p>
  `.trim();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'Unreal Tech <no-reply@unrealtech.co.uk>',
      to: ['admin@unrealtech.co.uk'],
      replyTo: emailVal,
      subject: 'Website Enquiry' + (serviceVal ? ' – ' + serviceVal : ''),
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};
