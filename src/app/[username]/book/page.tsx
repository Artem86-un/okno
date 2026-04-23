import { SiteShell } from "@/components/layout/site-shell";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getPublicPageData } from "@/lib/data";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function BookingPage({ params }: Props) {
  const { username } = await params;
  const { profile, services, bookingSlotsByService } =
    await getPublicPageData(username);

  return (
    <SiteShell compact hideGuestMenu resolveAuth={false}>
      <div className="mx-auto max-w-4xl py-6">
        <BookingFlow
          username={username}
          services={services}
          bookingSlotsByService={bookingSlotsByService}
          themePresetId={profile.bookingThemePresetId}
        />
      </div>
    </SiteShell>
  );
}
