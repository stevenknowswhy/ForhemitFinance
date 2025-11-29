import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();

/**
 * Metadata passed from client during upload
 */
type ReceiptUploadMeta = {
  userId: string; // Convex Id<"users"> as string
  transactionId?: string; // Id<"transactions_raw"> as string
};

type BusinessIconUploadMeta = {
  userId: string; // Convex Id<"users"> as string
};

export const ourFileRouter = {
  receiptUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
    "application/pdf": { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .input(z.object({
      userId: z.string(),
      transactionId: z.string().optional(),
    }))
    // Attach metadata submitted from client
    .middleware(async ({ input }) => {
      const userId = input?.userId;
      const transactionId = input?.transactionId;

      if (!userId) {
        throw new Error("Missing userId in upload metadata");
      }

      return {
        userId: String(userId),
        transactionId: transactionId ? String(transactionId) : undefined,
      } satisfies ReceiptUploadMeta;
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata?.userId);
      // Use ufsUrl if available, fallback to url for backward compatibility
      const fileUrl = (file as any).ufsUrl || file.url;
      console.log("file url", fileUrl);
      
      // Return enough data for client -> Convex mutation
      return {
        userId: metadata.userId,
        transactionId: metadata.transactionId,
        fileUrl: fileUrl,
        fileKey: file.key,
        originalFilename: file.name,
        mimeType: file.type || "image/jpeg", // fallback
        sizeBytes: file.size,
      };
    }),

  businessIconUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .input(z.object({
      userId: z.string(),
    }))
    .middleware(async ({ input }) => {
      const userId = input?.userId;

      if (!userId) {
        throw new Error("Missing userId in upload metadata");
      }

      return {
        userId: String(userId),
      } satisfies BusinessIconUploadMeta;
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Business icon upload complete for userId:", metadata?.userId);
      // Use ufsUrl if available, fallback to url for backward compatibility
      const fileUrl = (file as any).ufsUrl || file.url;
      console.log("Business icon url", fileUrl);
      
      // Return enough data for client -> Convex mutation
      return {
        userId: metadata.userId,
        fileUrl: fileUrl,
        fileKey: file.key,
        originalFilename: file.name,
        mimeType: file.type || "image/png", // fallback
        sizeBytes: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

