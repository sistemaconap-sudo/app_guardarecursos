"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch@1.1.3";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-amber-400",
        "dark:data-[state=checked]:bg-slate-600 dark:data-[state=unchecked]:bg-amber-300",
        "touch-manipulation select-none",
        // Tamaños compactos y responsivos
        "h-5 w-9 sm:h-5.5 sm:w-10 md:h-5 md:w-9",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform",
          "data-[state=unchecked]:translate-x-0",
          // Tamaños del thumb compactos y responsivos
          "h-4 w-4 data-[state=checked]:translate-x-4",
          "sm:h-4.5 sm:w-4.5 sm:data-[state=checked]:translate-x-[1.125rem]",
          "md:h-4 md:w-4 md:data-[state=checked]:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
