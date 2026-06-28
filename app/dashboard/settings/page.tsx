import { User, Bell, Palette, ChevronRight } from "lucide-react";

const SECTIONS = [
  { icon: User, title: "Profil", desc: "Robin · harmonie@levo.fr" },
  { icon: Bell, title: "Notifications", desc: "Alertes leads & validations" },
  { icon: Palette, title: "Apparence", desc: "Thème clair · palette Levo" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Paramètres
        </h1>
        <p className="text-sm text-muted">Préférences du compte et du dashboard.</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <ul className="divide-y divide-line/60">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-background"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted">
                  <Icon className="h-5 w-5" />
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
