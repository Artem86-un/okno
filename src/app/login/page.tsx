import { MessageCircleMore } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <SiteShell compact>
      <div className="mx-auto flex max-w-xl justify-center py-12">
        <Card className="w-full space-y-5">
          <div className="space-y-2">
            <h1 className="text-center text-4xl font-semibold text-ink">
              Вход в okno
            </h1>
          </div>
          <LoginForm />
          <div className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-medium text-ink">
            <MessageCircleMore size={16} className="mr-2" />
            Войти через Telegram
          </div>
          <ButtonLink href="/register" variant="ghost" className="w-full px-0">
            Создать аккаунт
          </ButtonLink>
        </Card>
      </div>
    </SiteShell>
  );
}
