import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { getSettingsData } from "@/lib/data";
import { canManageWorkspace, isTeamWorkspaceKind } from "@/lib/workspace";

export default async function SettingsPage() {
  const data = await getSettingsData();

  if (!data) {
    redirect("/login");
  }

  const { availabilityRules, profile, services } = data;
  const showWorkspaceAdminLink =
    canManageWorkspace(profile.accountRole) &&
    isTeamWorkspaceKind(profile.workspaceKind);

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Badge tone="accent">Настройки</Badge>
          <h1 className="text-4xl font-semibold text-ink">Профиль и параметры записи</h1>
        </div>
      </div>

      {showWorkspaceAdminLink ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-panel">
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Админка студии вынесена отдельно</p>
            <p className="text-sm leading-6 text-ink-soft">
              Управление сотрудниками и общей командой находится в отдельном разделе, чтобы личный кабинет не смешивался с администрированием.
            </p>
          </div>
          <ButtonLink href="/team" variant="secondary">
            Открыть админку
          </ButtonLink>
        </Card>
      ) : null}

      <SettingsTabs
        profile={profile}
        services={services}
        availabilityRules={availabilityRules}
      />
    </div>
  );
}
