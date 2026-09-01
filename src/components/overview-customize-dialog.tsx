"use client";

import { Settings2 } from "lucide-react";

import { useReportsContext } from "@/components/reports-provider";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  isOverviewModuleVisible,
  overviewModules,
  type OverviewModuleId,
} from "@/lib/overview-modules";
import { cn } from "@/lib/utils";

export function OverviewCustomizeDialog() {
  const { hiddenOverviewModules, setOverviewModuleVisible } =
    useReportsContext();

  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "rounded-xl"
        )}
      >
        <Settings2 className="size-4" />
        Customize
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize overview</DialogTitle>
          <DialogDescription>
            Choose which cards appear on the overview. Preferences are saved for
            this budget.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {overviewModules.map((module) => {
            const visible = isOverviewModuleVisible(
              module.id,
              hiddenOverviewModules
            );

            return (
              <label
                key={module.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5"
              >
                <Checkbox
                  checked={visible}
                  onCheckedChange={(checked) =>
                    setOverviewModuleVisible(module.id, checked === true)
                  }
                />
                <Label className="text-sm font-medium text-zinc-900">
                  {module.label}
                </Label>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <p className="w-full text-left text-xs text-zinc-500">
            At least one card should stay visible.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useOverviewModuleVisible(moduleId: OverviewModuleId) {
  const { hiddenOverviewModules } = useReportsContext();
  return isOverviewModuleVisible(moduleId, hiddenOverviewModules);
}
