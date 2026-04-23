"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAvatarAction, updatePortfolioWorksAction } from "@/app/actions/settings";
import { FormMessage } from "@/components/forms/auth-form-state";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/mock-data";
import {
  acceptedImageMimeTypes,
  buildProfileMediaStoragePath,
  maxAvatarFileSizeBytes,
  maxPortfolioFileSizeBytes,
  maxPortfolioWorks,
  profileMediaBucket,
} from "@/lib/profile-media";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const initialState = {
  success: false,
  message: "",
};

const imageAccept = acceptedImageMimeTypes.join(",");

async function removeUploadedPaths(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(profileMediaBucket).remove(paths);
}

async function uploadFileToStorage(input: {
  profile: Profile;
  file: File;
  kind: "avatar" | "portfolio";
}) {
  const supabase = createSupabaseBrowserClient();
  const path = buildProfileMediaStoragePath({
    ownerId: input.profile.passwordAuthId,
    kind: input.kind,
    file: input.file,
  });

  const { error } = await supabase.storage
    .from(profileMediaBucket)
    .upload(path, input.file, {
      cacheControl: "31536000",
      contentType: input.file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Не получилось загрузить файл в Storage.");
  }

  return path;
}

function AvatarUploadCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);

  const handleAvatarChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!acceptedImageMimeTypes.includes(file.type as (typeof acceptedImageMimeTypes)[number])) {
      setState({
        success: false,
        message: "Аватар должен быть в формате JPG, PNG, WebP или AVIF.",
      });
      return;
    }

    if (file.size > maxAvatarFileSizeBytes) {
      setState({
        success: false,
        message: "Аватар слишком большой. Выбери файл до 8 МБ.",
      });
      return;
    }

    setPending(true);
    setState(initialState);

    let uploadedPath: string | null = null;

    try {
      uploadedPath = await uploadFileToStorage({
        profile,
        file,
        kind: "avatar",
      });

      const result = await updateAvatarAction({ path: uploadedPath });
      setState(result);

      if (result.success) {
        router.refresh();
      } else {
        await removeUploadedPaths([uploadedPath]);
      }
    } catch (error) {
      if (uploadedPath) {
        await removeUploadedPaths([uploadedPath]);
      }

      setState({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Не получилось загрузить аватар.",
      });
    } finally {
      setPending(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <section className="space-y-4 rounded-[24px] bg-panel p-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">Аватар</p>
        <p className="text-xs leading-5 text-muted">
          Показывается в шапке публичной страницы и помогает сделать профиль
          узнаваемым.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-sm">
        <Image
          src={profile.avatarUrl}
          alt={profile.fullName}
          width={560}
          height={560}
          sizes="(max-width: 1279px) 100vw, 280px"
          className="h-64 w-full object-cover"
        />
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={imageAccept}
          className="sr-only"
          onChange={(event) => {
            void handleAvatarChange(event.currentTarget.files?.[0] ?? null);
          }}
        />

        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="w-full justify-center"
        >
          {pending ? "Загружаю аватар..." : "Обновить аватар"}
        </Button>

        <p className="text-xs leading-5 text-muted">
          После выбора файл сразу загрузится и заменит текущий аватар. JPG, PNG,
          WebP или AVIF, до 8 МБ.
        </p>

        <FormMessage message={state.message} success={state.success} />
      </div>
    </section>
  );
}

function PortfolioUploadSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);

  const handlePortfolioChange = async (files: FileList | null) => {
    const selectedFiles = files ? Array.from(files) : [];

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > maxPortfolioWorks) {
      setState({
        success: false,
        message: `Можно загрузить не больше ${maxPortfolioWorks} готовых работ за раз.`,
      });
      return;
    }

    for (const file of selectedFiles) {
      if (!acceptedImageMimeTypes.includes(file.type as (typeof acceptedImageMimeTypes)[number])) {
        setState({
          success: false,
          message: "Готовые работы должны быть в формате JPG, PNG, WebP или AVIF.",
        });
        return;
      }

      if (file.size > maxPortfolioFileSizeBytes) {
        setState({
          success: false,
          message: "Одна из работ слишком большая. Выбирай изображения до 8 МБ каждое.",
        });
        return;
      }
    }

    setPending(true);
    setState(initialState);

    const uploadedPaths: string[] = [];

    try {
      for (const file of selectedFiles) {
        const path = await uploadFileToStorage({
          profile,
          file,
          kind: "portfolio",
        });
        uploadedPaths.push(path);
      }

      const result = await updatePortfolioWorksAction({ paths: uploadedPaths });
      setState(result);

      if (result.success) {
        router.refresh();
      } else {
        await removeUploadedPaths(uploadedPaths);
      }
    } catch (error) {
      await removeUploadedPaths(uploadedPaths);
      setState({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Не получилось загрузить готовые работы.",
      });
    } finally {
      setPending(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <section className="space-y-4 rounded-[24px] border border-line bg-[rgba(250,248,244,0.88)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-ink">Готовые работы</h3>
          <p className="text-sm leading-6 text-ink-soft">
            На публичной странице они появятся отдельным блоком, а клиент сможет
            открыть галерею в pop-up и спокойно пролистать все изображения.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
          {profile.portfolioWorks.length} из {maxPortfolioWorks}
        </span>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={imageAccept}
          className="sr-only"
          onChange={(event) => {
            void handlePortfolioChange(event.currentTarget.files);
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            {pending
              ? "Загружаю работы..."
              : profile.portfolioWorks.length > 0
                ? "Обновить готовые работы"
                : "Добавить готовые работы"}
          </Button>
          <p className="text-xs leading-5 text-muted">
            Можно выбрать до {maxPortfolioWorks} файлов сразу. После выбора они
            автоматически загрузятся и заменят текущую подборку.
          </p>
        </div>

        <FormMessage message={state.message} success={state.success} />
      </div>

      {profile.portfolioWorks.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {profile.portfolioWorks.map((work, index) => (
            <div
              key={work.id}
              className="overflow-hidden rounded-[20px] border border-line bg-white"
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={work.imageUrl}
                  alt={`${profile.fullName}, работа ${index + 1}`}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <div className="px-3 py-3 text-xs text-muted">Работа {index + 1}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-line bg-white px-4 py-5 text-sm leading-6 text-muted">
          Пока без прикреплённых работ. Как только загрузишь подборку, она
          появится на публичной странице отдельной галереей.
        </div>
      )}
    </section>
  );
}

export function ProfileMediaUploadSection({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-6">
      <AvatarUploadCard profile={profile} />
      <PortfolioUploadSection profile={profile} />
    </div>
  );
}
