import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  customRangeError,
  type CustomDateRange,
} from "@/lib/reports/report-range";
import { cn } from "@/lib/utils";

type CustomDateRangeFieldsProps = {
  idPrefix: string;
  value: CustomDateRange;
  onChange: (value: CustomDateRange) => void;
  className?: string;
};

export function CustomDateRangeFields({
  idPrefix,
  value,
  onChange,
  className,
}: CustomDateRangeFieldsProps) {
  const error = customRangeError(value);

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-start`} className="text-xs text-zinc-500">
          From
        </Label>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          value={value.start}
          onChange={(event) =>
            onChange({ ...value, start: event.target.value })
          }
          className="rounded-xl"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-end`} className="text-xs text-zinc-500">
          To
        </Label>
        <Input
          id={`${idPrefix}-end`}
          type="date"
          value={value.end}
          onChange={(event) => onChange({ ...value, end: event.target.value })}
          className="rounded-xl"
        />
      </div>
      {error ? (
        <p className="col-span-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
