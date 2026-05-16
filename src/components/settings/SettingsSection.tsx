import { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-[10px] uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-1">
        {title}
      </h3>
      {children}
    </section>
  );
}
