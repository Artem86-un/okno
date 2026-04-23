import { PublicProfileView } from "@/components/public/public-profile-view";
import { getPublicPageData } from "@/lib/data";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const { profile, services, bookingSlotsByService } = await getPublicPageData(username);

  return (
    <PublicProfileView
      profile={profile}
      services={services}
      bookingSlotsByService={bookingSlotsByService}
      bookingHref={`/${username}/book`}
      eyebrowLabel={`Онлайн-запись @${username}`}
      showDemoSections={false}
    />
  );
}
