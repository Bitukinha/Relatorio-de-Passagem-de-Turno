import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

// Built lazily inside the createStart() factory (not at module scope) so
// construction only happens after every module has finished initializing —
// building these eagerly at import time is fragile under some server bundle
// chunk-splitting outcomes, where a circular import can make
// createCsrfMiddleware still be undefined when this module's top level runs.
export const startInstance = createStart(() => {
  const errorMiddleware = createMiddleware().server(async ({ next }) => {
    try {
      return await next();
    } catch (error) {
      if (error != null && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  });

  // Start installs this automatically when src/start.ts is absent; defining
  // the file opts out, so re-add it explicitly to keep server functions
  // protected from cross-site requests.
  const csrfMiddleware = createCsrfMiddleware({
    filter: (ctx) => ctx.handlerType === "serverFn",
  });

  return { requestMiddleware: [errorMiddleware, csrfMiddleware] };
});
