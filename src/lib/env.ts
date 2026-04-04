export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  smsApiUrl: process.env.SMS_API_URL,
  smsApiKey: process.env.SMS_API_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey,
);

export const isSmsConfigured = Boolean(env.smsApiUrl && env.smsApiKey);

export const isTelegramConfigured = Boolean(env.telegramBotToken);
