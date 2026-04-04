import Image from "next/image";
import { MapPin, MessageCircleHeart } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mock-data";
import { getPublicPageData } from "@/lib/data";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const { profile, services } = await getPublicPageData(username);

  return (
    <SiteShell compact>
      <div className="mx-auto max-w-5xl space-y-6 py-4">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="relative min-h-72 bg-[var(--color-panel)]">
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 35vw, 100vw"
                priority
                loading="eager"
              />
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              <Badge tone="accent">@{username}</Badge>
              <div>
                <h1 className="text-4xl font-semibold text-[var(--color-ink)]">{profile.fullName}</h1>
                <p className="mt-2 text-lg text-[var(--color-ink-soft)]">{profile.specialty}</p>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-[var(--color-ink-soft)]">
                {profile.bio}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-2">
                  <MapPin size={16} />
                  {profile.locationText}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-2">
                  <MessageCircleHeart size={16} />
                  Подтверждение на сайте + SMS
                </span>
              </div>
              <ButtonLink href={`/${username}/book`} className="w-fit">
                Записаться
              </ButtonLink>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{service.title}</h2>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--color-ink-soft)]">
                    {service.description}
                  </p>
                </div>
                <div className="text-right text-[var(--color-ink-soft)]">
                  <p>{service.durationMinutes} мин</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
                    {formatCurrency(service.price)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
