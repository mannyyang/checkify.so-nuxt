import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { createClient } from '@supabase/supabase-js';
import { TIER_LIMITS } from '~/lib/pricing';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default defineEventHandler(async (event) => {
  const { user, notion_auth } = event.context;
  const body: DatabaseObjectResponse = await readBody(event);

  if (!body || !notion_auth || !user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required data'
    });
  }

  // Get user's subscription tier
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  const userTier = subscription?.tier || 'free';
  const tierLimits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS];

  // Count existing todo lists
  const { count: existingListsCount } = await supabase
    .from('todo_list')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Check if user has reached their limit
  if (existingListsCount && existingListsCount >= tierLimits.maxTodoLists) {
    throw createError({
      statusCode: 403,
      statusMessage: `You've reached the limit of ${tierLimits.maxTodoLists} todo lists for your ${userTier} plan. Please upgrade to add more.`
    });
  }

  // Proceed with creating the todo list
  const { error } = await supabase.from('notion_database').upsert({
    notion_database_id: body.id,
    // @ts-ignore
    name: body.name,
    metadata: body,
    access_token: notion_auth.access_token
  });

  if (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save database information'
    });
  }

  const { error: todo_list_error, data: todoListData } = await supabase
    .from('todo_list')
    .upsert({
      user_id: user.id,
      notion_database_id: body.id
    })
    .select()
    .single();

  if (todo_list_error) {
    console.log(todo_list_error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create todo list'
    });
  }

  return {
    success: true,
    data: {
      todo_list: todoListData,
      database: body
    }
  };
});
