"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useReportsContext } from "@/components/reports-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeModeLabel } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useReportsContext();
  const Icon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("rounded-xl", className)}
            aria-label={`Theme: ${themeModeLabel(theme)}`}
          >
            <Icon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="rounded-xl">
        {(["light", "dark", "system"] as const).map((mode) => (
          <DropdownMenuItem
            key={mode}
            onClick={() => setTheme(mode)}
            className={cn(theme === mode && "font-medium")}
          >
            {themeModeLabel(mode)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
