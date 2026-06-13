const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envPath = path.resolve(process.cwd(), '.env');
const envText = fs.readFileSync(envPath, 'utf8');
const env = envText.split(/\r?\n/).filter(Boolean).reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2];
  return acc;
}, {});
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE connection info');
  process.exit(1);
}
const supabase = createClient(url, key);
const tables = ['profiles', 'blood_requests', 'donor_responses', 'donations', 'notifications', 'blood_inventory'];
(async () => {
  console.log('SUPABASE_URL', url);
  for (const table of tables) {
    const res = await supabase.from(table).select('id').limit(1);
    if (res.error) {
      console.log(`TABLE ${table}: MISSING or inaccessible`, res.error.message);
    } else {
      console.log(`TABLE ${table}: EXISTS (${res.data.length} rows returned)`);
    }
  }

  const bucketsRes = await supabase.storage.listBuckets();
  if (bucketsRes.error) {
    console.log('BUCKETS: ERROR', bucketsRes.error.message);
  } else {
    console.log('BUCKETS', (bucketsRes.data || []).map((b) => ({ id: b.id, public: b.public })).sort((a, b) => a.id.localeCompare(b.id)));
  }

  process.exit(0);
})();
