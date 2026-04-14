import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange }: DateRangeFilterProps) => (
  <div className="flex flex-wrap gap-4 items-end">
    <div className="space-y-1">
      <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data inicial</Label>
      <Input
        id="start-date"
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="w-40"
      />
    </div>
    <div className="space-y-1">
      <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data final</Label>
      <Input
        id="end-date"
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="w-40"
      />
    </div>
  </div>
);

export default DateRangeFilter;
