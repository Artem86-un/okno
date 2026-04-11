import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBookingConfirmationData } from "@/lib/data";

type ConfirmPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    bookingId?: string;
  }>;
};

export default async function ConfirmPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const { username } = await params;
  const query = await searchParams;
  const bookingId =
    typeof query.bookingId === "string" ? query.bookingId : "";
  const booking = await getBookingConfirmationData(username, bookingId);

  if (!booking) {
    notFound();
  }

  return (
    <SiteShell compact hideGuestMenu>
      <div className="mx-auto max-w-3xl py-10">
        <Card className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 size={28} className="text-success" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-ink">Запись подтверждена</h1>
            <p className="text-sm leading-7 text-ink-soft">
              {booking.clientName}, запись принята. Сохрани это время, чтобы не потерять его.
            </p>
          </div>
          <div className="rounded-[28px] bg-panel p-5 text-left">
            <p className="font-medium text-ink">{booking.serviceTitle}</p>
            <p className="mt-2 text-sm text-ink-soft">{booking.startsAtLabel}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/${username}`}>Вернуться к мастеру</ButtonLink>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
