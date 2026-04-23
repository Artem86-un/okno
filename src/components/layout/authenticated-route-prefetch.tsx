"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function scheduleIdle(callback: () => void) {
  if (typeof globalThis.window === "undefined") {
    return () => undefined;
  }

  if (typeof globalThis.requestIdleCallback === "function") {
    const idleId = globalThis.requestIdleCallback(
      () => callback(),
      { timeout: 1200 },
    );

    return () => globalThis.cancelIdleCallback(idleId);
  }

  const timeoutId = globalThis.setTimeout(callback, 150);
  return () => globalThis.clearTimeout(timeoutId);
}

export function AuthenticatedRoutePrefetch({
  routes,
}: {
  routes: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const filteredRoutes = Array.from(
    new Set(routes.filter((href) => href !== pathname)),
  );
  const routesKey = filteredRoutes.join("|");

  useEffect(() => {
    if (filteredRoutes.length === 0) {
      return;
    }

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const prefetchRoute = (href: string) => {
      const cleanup = scheduleIdle(() => {
        if (cancelled) {
          return;
        }

        const prefetchOptions: NonNullable<Parameters<typeof router.prefetch>[1]> = {
          kind: "auto" as NonNullable<
            Parameters<typeof router.prefetch>[1]
          >["kind"],
          onInvalidate: () => {
            if (!cancelled) {
              prefetchRoute(href);
            }
          },
        };

        router.prefetch(href, prefetchOptions);
      });

      cleanups.push(cleanup);
    };

    filteredRoutes.forEach((href, index) => {
      const cleanup = scheduleIdle(() => {
        if (cancelled) {
          return;
        }

        const timeoutId = globalThis.setTimeout(() => {
          prefetchRoute(href);
        }, index * 250);

        cleanups.push(() => globalThis.clearTimeout(timeoutId));
      });

      cleanups.push(cleanup);
    });

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [pathname, router, filteredRoutes, routesKey]);

  return null;
}
