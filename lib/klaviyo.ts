const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2024-10-15';

function authHeaders() {
  const key = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!key) throw new Error('KLAVIYO_PRIVATE_API_KEY is not set');
  return {
    Authorization: `Klaviyo-API-Key ${key}`,
    revision: KLAVIYO_REVISION,
    'Content-Type': 'application/json',
  };
}

export async function createProfile(opts: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  properties?: Record<string, unknown>;
}): Promise<string> {
  const res = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          email: opts.email,
          first_name: opts.firstName ?? undefined,
          last_name: opts.lastName ?? undefined,
          properties: opts.properties ?? {},
        },
      },
    }),
  });

  // 409 = profile already exists — Klaviyo returns the existing ID in the error body
  if (res.status === 409) {
    const err = (await res.json()) as {
      errors?: Array<{ meta?: { duplicate_profile_id?: string } }>;
    };
    const existingId = err.errors?.[0]?.meta?.duplicate_profile_id;
    if (existingId) return existingId;
    throw new Error('Klaviyo profile conflict — no duplicate_profile_id returned');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Klaviyo createProfile ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { data?: { id?: string } };
  const id = data.data?.id;
  if (!id) throw new Error('Klaviyo createProfile: no ID in response');
  return id;
}

export async function subscribeToList(profileId: string, listId: string): Promise<void> {
  const res = await fetch(`${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                id: profileId,
                attributes: {
                  subscriptions: {
                    email: { marketing: { consent: 'SUBSCRIBED' } },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: { data: { type: 'list', id: listId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Klaviyo subscribeToList ${res.status}: ${text}`);
  }
}

export async function trackEvent(
  email: string,
  eventName: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: eventName } } },
          profile: { data: { type: 'profile', attributes: { email } } },
          properties: properties ?? {},
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Klaviyo trackEvent ${res.status}: ${text}`);
  }
}
