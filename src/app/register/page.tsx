import { CheckCircle2, Link2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <SiteShell compact>
      <div className="mx-auto flex max-w-3xl justify-center py-10">
        <div className="w-full space-y-6">
          <Card className="space-y-5">
            <div className="space-y-2">
              <h1 className="text-center text-4xl font-semibold text-ink">
                Регистрация
              </h1>
            </div>
            <RegisterForm />
          </Card>

          <Card className="space-y-4 bg-panel">
            <div className="rounded-[24px] border border-line bg-white p-4">
              <div className="flex items-center gap-3">
                <Link2 size={18} className="text-accent-deep" />
                <p className="font-medium text-ink">okno.app/alina-nails</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                После регистрации у мастера сразу появится рабочая ссылка для клиентов.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Профиль мастера",
                "Первая услуга",
                "Ссылка для записи",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3">
                  <CheckCircle2 size={18} className="shrink-0 text-success" />
                  <p className="text-sm text-ink-soft">{item}</p>
                </div>
              ))}
            </div>
            <ButtonLink href="/login" variant="ghost" className="w-full">
              У меня уже есть аккаунт
            </ButtonLink>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
