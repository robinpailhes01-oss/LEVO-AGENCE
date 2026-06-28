import { User, Bell, Palette, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const SECTIONS = [
  { icon: User, title: "Profil", desc: "Robin · harmonie@levo.fr" },
  { icon: Bell, title: "Notifications", desc: "Alertes leads & validations" },
  { icon: Palette, title: "Apparence", desc: "Thème clair · palette Levo" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        subtitle="Préférences du compte et du dashboard."
      />

      <div className="levo-card overflow-hidden p-0">
        <ul className="divide-y divide-line/60">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-background"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{s.title}</p>
                  <p className="text-xs text-muted">{s.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-xs text-muted/70">
        Levo Dashboard · version démo visuelle
      </p>
    </div>
  );
}
