import { redirect } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { getDashboardData } from "@/lib/data";

export default async function SettingsPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  const { availabilityRules, profile, services } = data;

  return (
    <SiteShell compact>
      <div className="space-y-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge tone="accent">Настройки</Badge>
            <h1 className="text-4xl font-semibold text-[var(--color-ink)]">Профиль и параметры записи</h1>
          </div>
        </div>

        <SettingsTabs
          profile={profile}
          services={services}
          availabilityRules={availabilityRules}
        />
      </div>
    </SiteShell>
  );
}
