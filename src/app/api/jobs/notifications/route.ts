import { NextResponse } from "next/server";
import { env, isJobsSecretConfigured } from "@/lib/env";
import { processDueNotificationQueue } from "@/lib/notification-queue";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  const headerToken = request.headers.get("x-jobs-secret");

  return bearerToken === env.jobsSecret || headerToken === env.jobsSecret;
}

export async function POST(request: Request) {
  if (!isJobsSecretConfigured) {
    return NextResponse.json(
      { error: "Фоновый jobs-secret не настроен." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 401 });
  }

  try {
    const result = await processDueNotificationQueue(50);

    return NextResponse.json({
      ok: true,
      claimed: result.claimed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не получилось обработать очередь уведомлений.",
      },
      { status: 500 },
    );
  }
}
