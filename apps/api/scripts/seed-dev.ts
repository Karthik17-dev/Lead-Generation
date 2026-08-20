/**
 * Local dev seed / patch script:
 * Ensures the dev user, account, projects, and experimental feature flags are configured.
 *
 * Flags enabled:
 * - meta_agent: true  -> Meta coordinator agent enabled as default
 * - llm_gateway: true -> LLM Gateway enabled, providing 'zed' model and model picker
 * - apps: true        -> Apps tab shown in sidebar
 *
 * Run: bun run scripts/seed-dev.ts
 */
import postgres from 'postgres';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const ACCOUNT_ID = 'a0000000-0000-4000-8000-000000000001';
const PROJECT_ID = 'b0000000-0000-4000-8000-000000000001';
const PREV_PROJECT_ID = 'bfd52201-f9c1-4468-a96c-372368190d77';
const SESSION_ID = 'dev-local-session-01';

const PROJECT_METADATA = {
  experimental: {
    meta_agent: true,
    llm_gateway: true,
    apps: true,
  },
};

async function main() {
  console.log('1. Checking auth user...');
  let userId: string | null = null;
  try {
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });
    const list = await listRes.json();
    const existing = (list.users ?? []).find((u: any) => u.email === 'dev@example.com');
    if (existing) {
      userId = existing.id;
    } else {
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          email: 'dev@example.com',
          password: 'password123',
          email_confirm: true,
          user_metadata: { full_name: 'Local Developer', name: 'Local Developer' },
        }),
      });
      const created = await createRes.json();
      userId = created.id;
    }
  } catch (err) {
    console.warn('Auth service check failed, proceeding to DB directly:', err);
  }

  console.log('2. Updating database and project metadata...');
  const sql = postgres(DB_URL);

  try {
    // account
    await sql`
      INSERT INTO zed.accounts (account_id, name)
      VALUES (${ACCOUNT_ID}, 'Local Dev Account')
      ON CONFLICT (account_id) DO UPDATE SET name = EXCLUDED.name
    `;

    if (userId) {
      // account_member
      await sql`
        INSERT INTO zed.account_members (account_id, user_id, account_role)
        VALUES (${ACCOUNT_ID}, ${userId}, 'owner')
        ON CONFLICT (user_id, account_id) DO UPDATE SET account_role = 'owner'
      `;
    }

    // credit_account
    await sql`
      INSERT INTO zed.credit_accounts (account_id, balance, daily_credits_balance, expiring_credits, non_expiring_credits)
      VALUES (${ACCOUNT_ID}, 10000.00, 5000.00, 5000.00, 0.00)
      ON CONFLICT (account_id) DO UPDATE
        SET balance = 10000.00,
            daily_credits_balance = 5000.00
    `;

    // projects with full experimental metadata
    await sql`
      INSERT INTO zed.projects (project_id, account_id, name, repo_url, metadata)
      VALUES (${PROJECT_ID}, ${ACCOUNT_ID}, 'Local Dev Project', 'https://github.com/local/dev', ${PROJECT_METADATA})
      ON CONFLICT (project_id) DO UPDATE SET 
        name = EXCLUDED.name,
        metadata = ${PROJECT_METADATA}
    `;

    await sql`
      INSERT INTO zed.projects (project_id, account_id, name, repo_url, metadata)
      VALUES (${PREV_PROJECT_ID}, ${ACCOUNT_ID}, 'My First Project', 'https://github.com/local/my-first-project', ${PROJECT_METADATA})
      ON CONFLICT (project_id) DO UPDATE SET 
        name = EXCLUDED.name,
        metadata = ${PROJECT_METADATA}
    `;

    if (userId) {
      // project_member for both projects
      await sql`
        INSERT INTO zed.project_members (account_id, project_id, user_id, project_role)
        VALUES (${ACCOUNT_ID}, ${PROJECT_ID}, ${userId}, 'manager')
        ON CONFLICT (project_id, user_id) DO UPDATE SET project_role = 'manager'
      `;
      await sql`
        INSERT INTO zed.project_members (account_id, project_id, user_id, project_role)
        VALUES (${ACCOUNT_ID}, ${PREV_PROJECT_ID}, ${userId}, 'manager')
        ON CONFLICT (project_id, user_id) DO UPDATE SET project_role = 'manager'
      `;
    }

    // project_session
    await sql`
      INSERT INTO zed.project_sessions (session_id, account_id, project_id, branch_name, status)
      VALUES (${SESSION_ID}, ${ACCOUNT_ID}, ${PROJECT_ID}, 'main', 'stopped')
      ON CONFLICT (session_id) DO UPDATE SET status = 'stopped'
    `;

    console.log('✓ Database seeded with meta_agent, llm_gateway (zed model), and apps enabled.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Seed error:', err?.message || err);
  process.exit(1);
});
