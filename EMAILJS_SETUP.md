# EmailJS Setup Guide

This guide will help you set up EmailJS so that contact form submissions are sent to your email address (nolimolina1987@gmail.com).

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (free tier allows 200 emails/month)

## Step 2: Add Email Service

1. After logging in, go to **Email Services** in the dashboard
2. Click **Add New Service**
3. Choose **Gmail** (or your email provider)
4. Connect your Gmail account (nolimolina1987@gmail.com)
5. Note down your **Service ID** (e.g., `service_xxxxx`)

## Step 3: Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use the following template:

**Template Name:** Contact Form Submission

**Subject:** New Contact Form Message from {{from_name}}

**Content:**
```
You have received a new message from your website contact form:

Name: {{from_name}}
Email: {{from_email}}
Phone: {{phone}}
Subject: {{subject}}

Message:
{{message}}

---
This message was sent from Metro Manila Hills Construction Supply and Trading website.
```

4. Note down your **Template ID** (e.g., `template_xxxxx`)

## Step 4: Get Your Public Key

1. Go to **Account** → **General** in the dashboard
2. Find your **Public Key** (also called User ID)
3. Copy this key

## Step 5: Update Contact.vue

Open `src/views/Contact.vue` and replace the following placeholders:

1. **Line with `emailjs.init('YOUR_PUBLIC_KEY')`**
   - Replace `YOUR_PUBLIC_KEY` with your EmailJS Public Key

2. **In the `handleSubmit` method, find:**
   ```javascript
   await emailjs.send(
     'YOUR_SERVICE_ID',      // Replace with your EmailJS Service ID
     'YOUR_TEMPLATE_ID',     // Replace with your EmailJS Template ID
     emailParams
   )
   ```
   - Replace `YOUR_SERVICE_ID` with your Service ID
   - Replace `YOUR_TEMPLATE_ID` with your Template ID

## Step 6: Test the Form

1. Fill out the contact form on your website
2. Submit it
3. Check your email (nolimolina1987@gmail.com) for the message
4. Also check Firestore database for the saved record

## Troubleshooting

- **Email not received?** Check your spam folder
- **Error sending email?** Verify your Service ID, Template ID, and Public Key are correct
- **Rate limit?** Free tier allows 200 emails/month. Upgrade if needed.

## Security Note

The Public Key is safe to use in client-side code. Never share your Private Key or email service credentials.

