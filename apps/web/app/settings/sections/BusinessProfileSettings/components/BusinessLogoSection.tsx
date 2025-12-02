/**
 * Business Logo & Branding Section
 */

"use client";

import { Image as ImageIcon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/lib/uploadthing";
import { useToast } from "@/components/ui/hooks/use-toast";

interface BusinessLogoSectionProps {
  businessIcon: string;
  isUploadingIcon: boolean;
  currentUserId: string | undefined;
  onIconChange: (url: string) => void;
  onUploadBegin: () => void;
  onUploadError: (error: Error) => void;
  onUploadComplete: (res: Array<{
    url: string;
    name: string;
    serverData?: {
      fileUrl: string;
      fileKey: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
    };
  }>) => void;
}

export function BusinessLogoSection({
  businessIcon,
  isUploadingIcon,
  currentUserId,
  onIconChange,
  onUploadBegin,
  onUploadError,
  onUploadComplete,
}: BusinessLogoSectionProps) {
  const { toast } = useToast();

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Business Logo & Branding
        </CardTitle>
        <CardDescription>
          Upload your business logo to appear on all financial reports and documents. Recommended: Square logo (200x200px or larger), PNG or SVG format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {businessIcon ? (
              <div className="relative">
                <img
                  src={businessIcon}
                  alt="Business logo"
                  className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-muted p-4 shadow-sm"
                />
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/50 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                  <UploadButton
                    endpoint="businessIconUploader"
                    input={{
                      userId: currentUserId || "",
                    }}
                    onClientUploadComplete={onUploadComplete}
                    onUploadError={onUploadError}
                    onUploadBegin={onUploadBegin}
                    className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90 ut-button:rounded-md ut-button:px-4 ut-button:py-2"
                  />
                {isUploadingIcon && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Uploading logo...
                  </p>
                )}
              </div>
              {businessIcon && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onIconChange("");
                    toast({
                      title: "Logo removed",
                      description: "The logo will be removed when you save your profile.",
                    });
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove Logo
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Your logo will appear on the cover page of all financial reports, including Bank/Lender Application Snapshots, Investor Summaries, and other generated documents.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

