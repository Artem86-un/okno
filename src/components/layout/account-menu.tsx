"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Settings, CalendarDays, Users, LayoutDashboard, Globe, X } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  username?: string;
  authenticated: boolean;
};

const authLinks = [
  { href: "/dashboard", label: "Сегодня", icon: LayoutDashboard },
  { href: "/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/settings", label: "Настройки", icon: Settings },
];

const guestLinks = [
  { href: "/", label: "Главная" },
  { href: "/pricing", label: "Тарифы" },
  { href: "/login", label: "Войти" },
  { href: "/register", label: "Начать бесплатно" },
];

export function AccountMenu({ username, authenticated }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-panel)] active:scale-95",
          open && "border-[var(--color-ink-soft)] bg-white text-[var(--color-ink)]",
        )}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Menu
            size={18}
            className={cn(
              "absolute transition duration-300",
              open ? "scale-75 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <X
            size={18}
            className={cn(
              "absolute transition duration-300",
              open ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
          />
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Закрыть меню"
            className="fixed inset-0 z-40 bg-[rgba(26,26,23,0.1)]"
            onClick={() => setOpen(false)}
          />

          <div className="fixed right-4 top-20 z-50 w-[min(92vw,360px)] rounded-[28px] border border-[var(--color-line)] bg-white p-4 shadow-[0_30px_80px_rgba(35,36,31,0.16)] transition duration-300">
        {authenticated ? (
          <div className="space-y-2">
            <div className="rounded-[22px] bg-[var(--color-panel)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Навигация
              </p>
              <div className="mt-3 space-y-2">
                {authLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
                {username ? (
                  <Link
                    href={`/${username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  >
                    <Globe size={16} />
                    Публичная страница
                  </Link>
                ) : null}
              </div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-[22px] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-panel)] active:scale-[0.99]"
              >
                <span>Выйти из аккаунта</span>
                <LogOut size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            {guestLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-[20px] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-panel)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
          </div>
        </>
      ) : null}
    </>
  );
}
