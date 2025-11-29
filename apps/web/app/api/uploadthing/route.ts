import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    callbackUrl: process.env.UPLOADTHING_CALLBACK_URL || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/uploadthing`,
  },
});

