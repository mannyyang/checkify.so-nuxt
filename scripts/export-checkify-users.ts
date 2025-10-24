import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // eslint-disable-next-line no-console
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TransformedUser {
  email: string;
  fullName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  signupDate: string;
}

async function getUsers (): Promise<TransformedUser[]> {
  // Query user profiles
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, subscription_tier, subscription_status, created_at');

  if (profileError) {
    // eslint-disable-next-line no-console
    console.error('Error fetching profiles:', profileError);
    process.exit(1);
  }

  // Query all users from auth.users with pagination
  let allAuthUsers: any[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error: authError } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (authError) {
      // eslint-disable-next-line no-console
      console.error('Error fetching auth users:', authError);
      process.exit(1);
    }

    allAuthUsers = allAuthUsers.concat(data.users);

    // Check if we got fewer results than requested, meaning we're done
    if (data.users.length < perPage) {
      break;
    }

    page++;
  }

  // Create a map of user_id to profile
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  // Transform the data
  const transformedUsers: TransformedUser[] = allAuthUsers.map((user) => {
    const profile = profileMap.get(user.id);
    const metadata = user.user_metadata || {};

    // Format signup date as YYYY-MM-DD
    const signupDate = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '';

    return {
      email: user.email || '',
      fullName: metadata.full_name || metadata.name || metadata.user_name || '',
      subscriptionTier: profile?.subscription_tier || 'free',
      subscriptionStatus: profile?.subscription_status || 'active',
      signupDate
    };
  });

  return transformedUsers;
}

async function main () {
  const format = process.argv[2] || 'json'; // json or csv

  const users = await getUsers();

  if (format === 'csv') {
    // Output CSV format
    // eslint-disable-next-line no-console
    console.log('email,fullName,subscriptionTier,subscriptionStatus,signupDate');
    users.forEach((user) => {
      // eslint-disable-next-line no-console
      console.log(`"${user.email}","${user.fullName}","${user.subscriptionTier}","${user.subscriptionStatus}","${user.signupDate}"`);
    });
  } else {
    // Output JSON format
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(users, null, 2));
  }

  // Output summary to stderr so it doesn't interfere with data output
  // eslint-disable-next-line no-console
  console.error(`\n📊 Summary:`);
  // eslint-disable-next-line no-console
  console.error(`Total users: ${users.length}`);
  // eslint-disable-next-line no-console
  console.error(`Free tier: ${users.filter((u) => u.subscriptionTier === 'free').length}`);
  // eslint-disable-next-line no-console
  console.error(`Pro tier: ${users.filter((u) => u.subscriptionTier === 'pro').length}`);
  // eslint-disable-next-line no-console
  console.error(`Max tier: ${users.filter((u) => u.subscriptionTier === 'max').length}`);
}

main();
