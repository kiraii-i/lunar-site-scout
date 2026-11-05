import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SITES, type SiteId } from "@/lib/science";

export function SiteSelect({ value, onChange }: { value: SiteId; onChange: (v: SiteId) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SiteId)}>
      <SelectTrigger className="w-52" aria-label="Study area"><SelectValue /></SelectTrigger>
      <SelectContent>{SITES.map((s) => <SelectItem key={s.site_id} value={s.site_id}>{s.name}</SelectItem>)}</SelectContent>
    </Select>
  );
}

/** Current UTC time as a value for <input type="datetime-local">, interpreted as UTC. */
export function utcInputNow() {
  return new Date().toISOString().slice(0, 16);
}
export function inputToIsoUtc(v: string) {
  return v ? `${v}:00Z` : "";
}
