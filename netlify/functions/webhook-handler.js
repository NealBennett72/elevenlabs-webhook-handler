// netlify/functions/webhook-handler.js
const OpenAI = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mandrill SMTP configuration using environment variables
const transporter = nodemailer.createTransporter({
  host: process.env.MANDRILL_HOST || 'smtp.mandrillapp.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MANDRILL_USER,
    pass: process.env.MANDRILL_API_KEY,
  },
});

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the webhook payload from ElevenLabs
    const payload = JSON.parse(event.body);
    
    // Log the received payload (remove in production)
    console.log('Received ElevenLabs webhook:', payload);

    // Extract transcript from ElevenLabs payload
    // Adjust this based on actual ElevenLabs webhook structure
    const transcript = payload.transcript || payload.text || payload.audio_text || '';
    
    if (!transcript) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No transcript found in payload' }),
      };
    }

    // Use OpenAI to create a human-readable summary
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates clear, concise summaries of transcripts. Provide a well-structured synopsis that captures the main points, key themes, and important details in an easy-to-read format.',
        },
        {
          role: 'user',
          content: `Please create a human-readable summary of this transcript:\n\n${transcript}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const summary = completion.choices[0].message.content;

    // Prepare email content
    const emailHtml = `
      <html>
        <body>
          <h2>ElevenLabs Transcript Summary</h2>
          <p><strong>Received:</strong> ${new Date().toISOString()}</p>
          
          <h3>Summary</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${summary.replace(/\n/g, '<br>')}
          </div>
          
          <h3>Full Transcript</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace;">
            ${transcript.replace(/\n/g, '<br>')}
          </div>
          
          <hr>
          <p><em>Generated automatically by your Netlify webhook handler</em></p>
        </body>
      </html>
    `;

    // Send email via Mandrill
    const mailOptions = {
      from: process.env.MANDRILL_USER,
      to: process.env.TARGET_EMAIL || 'info@beethovenathome.com',
      subject: 'ElevenLabs Transcript Summary',
      html: emailHtml,
      text: `Summary:\n${summary}\n\nFull Transcript:\n${transcript}`,
    };

    await transporter.sendMail(mailOptions);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Webhook processed successfully',
        summary: summary,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};