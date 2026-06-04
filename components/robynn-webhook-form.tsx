'use client';

import { useState, type FormEvent } from 'react';

import type { SiteContent } from '@/lib/content';

type FormConfig = SiteContent['forms'][string];

type RobynnWebhookFormProps = {
  config: FormConfig;
  webhookUrl?: string;
};

export function RobynnWebhookForm({
  config,
  webhookUrl,
}: RobynnWebhookFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>(
    'idle',
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (webhookUrl) {
      setStatus('submitting');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          formId: config.id,
          source: 'meadowview-apartments',
          payload,
        }),
      });

      if (response.ok) {
        form.reset();
        setStatus('sent');
        return;
      }

      setStatus('error');
      return;
    }

    const name = String(formData.get('name') ?? '');
    const email = String(formData.get('email') ?? '');
    const providedSubject = String(formData.get('subject') ?? '').trim();
    const subject = providedSubject || config.defaultSubject;
    const message = String(formData.get('message') ?? '');
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      `Message: ${message}`,
    ].join('\n');

    window.location.href = `mailto:${config.fallbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-robynn-form={config.id}
      data-robynn-target="home__contact_form"
    >
      {config.fields.map((field) => (
        <div className="form-group" key={field.name}>
          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              placeholder={`${field.label}${field.required ? ' *' : ''}`}
              rows={5}
              required={field.required}
            ></textarea>
          ) : (
            <input
              type={field.type}
              name={field.name}
              autoComplete={field.autoComplete}
              placeholder={`${field.label}${field.required ? ' *' : ''}`}
              required={field.required}
            />
          )}
        </div>
      ))}
      <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : config.submitLabel}
      </button>
      {status === 'sent' ? <p className="form-status">Thanks, we will be in touch soon.</p> : null}
      {status === 'error' ? (
        <p className="form-status">Please try again or email us directly.</p>
      ) : null}
    </form>
  );
}
