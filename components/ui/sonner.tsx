"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const iconProps = { className: "size-4", strokeWidth: 1.5 as const };

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon {...iconProps} />,
        info: <InfoIcon {...iconProps} />,
        warning: <TriangleAlertIcon {...iconProps} />,
        error: <OctagonXIcon {...iconProps} />,
        loading: <Loader2Icon {...iconProps} className="size-4 animate-spin" strokeWidth={1.5} />,
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast text-[13px]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
