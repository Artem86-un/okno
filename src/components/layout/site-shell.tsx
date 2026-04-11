import Link from "next/link";
import { AccountMenu } from "@/components/layout/account-menu";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import { ButtonLink } from "@/components/ui/button";
import { getAccountNotificationPanelData, getCurrentAuthProfile } from "@/lib/data";

const links = [
  { href: "/", label: "Главная" },
  { href: "/pricing", label: "Тарифы" },
  { href: "/dashboard", label: "Кабинет" },
  { href: "/alina-nails", label: "Публичная страница" },
];

export async function SiteShell({
  children,
  compact = false,
  hideGuestMenu = false,
  showAccountNotifications = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  hideGuestMenu?: boolean;
  showAccountNotifications?: boolean;
}) {
  const authProfile = await getCurrentAuthProfile();
  const accountNotifications =
    authProfile && showAccountNotifications
      ? await getAccountNotificationPanelData(authProfile)
      : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(184,211,196,0.4),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(247,226,211,0.6),_transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 mb-6 rounded-full border border-line bg-white/95 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-ink">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                o
              </span>
              okno
            </Link>
            {!compact ? (
              <nav className="hidden items-center gap-5 md:flex">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-ink-soft transition hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            <div className="flex items-center gap-3">
              {authProfile ? (
                <>
                  {accountNotifications ? (
                    <NotificationsPanel
                      items={accountNotifications.items}
                      storageKey={accountNotifications.storageKey}
                    />
                  ) : null}
                  <AccountMenu
                    authenticated
                    username={authProfile.profile.username}
                  />
                </>
              ) : (
                <>
                  <div className="hidden items-center gap-3 sm:flex">
                    <ButtonLink href="/login" variant="ghost">
                      Войти
                    </ButtonLink>
                    <ButtonLink href="/register">Начать бесплатно</ButtonLink>
                  </div>
                  <div className={hideGuestMenu ? "hidden" : "sm:hidden"}>
                    <AccountMenu authenticated={false} />
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
