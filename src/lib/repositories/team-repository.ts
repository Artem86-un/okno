import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isRetryableSupabaseNetworkError } from "@/lib/supabase/auth-errors";

type Row = Record<string, unknown>;

export async function getWorkspaceTeamRows(input: { workspaceId: string }) {
  const admin = createSupabaseAdminClient();

  const { data: memberRows, error: memberError } = await admin
    .from("profiles")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at");

  if (memberError) {
    if (isRetryableSupabaseNetworkError(memberError)) {
      throw new Error(
        "Нет связи с командой. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить сотрудников.");
  }

  const memberIds = (memberRows ?? []).map((row) => String(row.id));

  if (memberIds.length === 0) {
    return {
      members: [] as Row[],
      services: [] as Row[],
      bookings: [] as Row[],
      clients: [] as Row[],
    };
  }

  const [serviceResult, bookingResult, clientResult] = await Promise.all([
    admin
      .from("services")
      .select("*")
      .in("profile_id", memberIds)
      .order("sort_order", { ascending: true }),
    admin
      .from("bookings")
      .select("*")
      .in("profile_id", memberIds)
      .order("starts_at", { ascending: true }),
    admin
      .from("clients")
      .select("*")
      .in("profile_id", memberIds)
      .order("last_booking_at", { ascending: false }),
  ]);

  if (serviceResult.error || bookingResult.error || clientResult.error) {
    if (
      [
        serviceResult.error,
        bookingResult.error,
        clientResult.error,
      ].some((error) => isRetryableSupabaseNetworkError(error))
    ) {
      throw new Error(
        "Нет связи с командой. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить данные команды.");
  }

  return {
    members: (memberRows ?? []) as Row[],
    services: (serviceResult.data ?? []) as Row[],
    bookings: (bookingResult.data ?? []) as Row[],
    clients: (clientResult.data ?? []) as Row[],
  };
}
