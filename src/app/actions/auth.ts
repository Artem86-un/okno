"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  success: boolean;
  message: string;
};

const registerSchema = z.object({
  fullName: z.string().min(2),
  specialty: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).regex(/^[a-z0-9-]+$/),
  serviceTitle: z.string().min(2),
  servicePrice: z.coerce.number().min(0),
  serviceDurationMinutes: z.coerce.number().min(15),
  timezone: z.string().min(3),
  serviceDescription: z.string().optional().default(""),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function registerMasterAction(
  _prevState: AuthActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "Supabase еще не подключен. Добавь ключи в .env.local, и регистрация станет реальной.",
    };
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Проверь форму: имя, email, пароль, username и параметры услуги.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (existingProfile) {
    return { success: false, message: "Этот username уже занят." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      success: false,
      message: error?.message || "Не получилось создать аккаунт.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    email: parsed.data.email,
    password_auth_id: data.user.id,
    full_name: parsed.data.fullName,
    username: parsed.data.username,
    specialty: parsed.data.specialty,
    timezone: parsed.data.timezone,
    bio: "",
    location_text: "",
  });

  if (profileError) {
    return {
      success: false,
      message: "Аккаунт создался, но профиль мастера не записался в базу.",
    };
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("id")
    .eq("password_auth_id", data.user.id)
    .single();

  if (profileRow) {
    await admin.from("services").insert({
      profile_id: profileRow.id,
      title: parsed.data.serviceTitle,
      description: parsed.data.serviceDescription,
      duration_minutes: parsed.data.serviceDurationMinutes,
      price: parsed.data.servicePrice,
      sort_order: 1,
      is_active: true,
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function loginMasterAction(
  _prevState: AuthActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "Supabase еще не подключен. Добавь ключи в .env.local, и вход станет реальным.",
    };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Проверь email и пароль." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      message: "Не получилось войти. Проверь email и пароль.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOutAction() {
  if (!isSupabaseConfigured) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
