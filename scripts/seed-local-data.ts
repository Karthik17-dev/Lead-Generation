import postgres from 'postgres';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function main() {
  console.log('1. Creating / ensuring mock user in Supabase Auth...');
  const userPayload = {
    email: 'user@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Developer',
      name: 'Test Developer',
      avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
    },
  };

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(userPayload),
  });

  const userData = await createRes.json();
  let userId = userData.id || userData.user?.id;

  if (!userId) {
    // User already exists, fetch users list
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });
    const listData = await listRes.json();
    const existing = listData.users?.find((u: any) => u.email === 'user@example.com');
    if (existing) {
      userId = existing.id;
    }
  }

  console.log('User ID:', userId);

  console.log('2. Creating mock account, project, session and credits in Postgres...');
  const sql = postgres(DB_URL);

  const accountId = 'bfd52201-f9c1-4468-a96c-372368190d77'; // Match the requested project/account id!
  const projectId = 'bfd52201-f9c1-4468-a96c-372368190d77';
  const sessionId = 'fd6914ea-b078-4a61-92c6-b8592493c2e3';

  // Ensure account
  await sql`
    INSERT INTO zed.accounts (id, name, slug, personal_account, primary_owner_user_id, created_at, updated_at)
    VALUES (${accountId}, 'Personal', 'personal', true, ${userId}, now(), now())
    ON CONFLICT (id) DO UPDATE SET primary_owner_user_id = ${userId};
  `;

  // Ensure account member
  await sql`
    INSERT INTO zed.account_members (account_id, user_id, role, created_at, updated_at)
    VALUES (${accountId}, ${userId}, 'owner', now(), now())
    ON CONFLICT (account_id, user_id) DO UPDATE SET role = 'owner';
  `;

  // Ensure credit account
  await sql`
    INSERT INTO zed.credit_accounts (account_id, balance, daily_credits_balance, expiring_credits, non_expiring_credits, created_at, updated_at)
    VALUES (${accountId}, 10000.00, 5000.00, 5000.00, 0.00, now(), now())
    ON CONFLICT (account_id) DO UPDATE SET balance = 10000.00, daily_credits_balance = 5000.00;
  `;

  // Ensure project
  await sql`
    INSERT INTO zed.projects (id, account_id, name, created_by, created_at, updated_at)
    VALUES (${projectId}, ${accountId}, 'My Project', ${userId}, now(), now())
    ON CONFLICT (id) DO UPDATE SET name = 'My Project', account_id = ${accountId};
  `;

  // Ensure project member
  await sql`
    INSERT INTO zed.project_roles (project_id, user_id, role, created_at, updated_at)
    VALUES (${projectId}, ${userId}, 'owner', now(), now())
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'owner';
  `;

  // Ensure project session
  await sql`
    INSERT INTO zed.project_sessions (id, project_id, account_id, title, created_by, status, created_at, updated_at)
    VALUES (${sessionId}, ${projectId}, ${accountId}, 'New Session', ${userId}, 'idle', now(), now())
    ON CONFLICT (id) DO UPDATE SET status = 'idle', title = 'New Session';
  `;

  console.log('Seeded account, project, project_roles, credit_accounts, and session successfully!');
  await sql.end();
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
