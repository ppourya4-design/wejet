import React from 'react';
import { WidgetInstance, WidgetManifest } from '../types/models';
import { clockManifest, ClockWidget } from './ClockWidget';
import { calendarManifest, CalendarWidget } from './CalendarWidget';
import { weatherManifest, WeatherWidget } from './WeatherWidget';
import { systemManifest, SystemWidget } from './SystemWidget';
import { pricesManifest, PricesWidget } from './PricesWidget';
import { notesManifest, NotesWidget } from './NotesWidget';
import { launcherManifest, LauncherWidget } from './LauncherWidget';
import { musicManifest, MusicWidget } from './MusicWidget';

export interface RegisteredWidget {
  manifest: WidgetManifest;
  component: React.ComponentType<{ instance: WidgetInstance }>;
}

class CentralWidgetRegistry {
  private readonly store = new Map<string, RegisteredWidget>();

  register(entry: RegisteredWidget): void {
    this.store.set(entry.manifest.id, entry);
  }

  get(id: string): RegisteredWidget | undefined {
    return this.store.get(id);
  }

  list(): RegisteredWidget[] {
    return Array.from(this.store.values());
  }
}

export const WidgetRegistry = new CentralWidgetRegistry();

WidgetRegistry.register({ manifest: clockManifest, component: ClockWidget });
WidgetRegistry.register({ manifest: calendarManifest, component: CalendarWidget });
WidgetRegistry.register({ manifest: weatherManifest, component: WeatherWidget });
WidgetRegistry.register({ manifest: systemManifest, component: SystemWidget });
WidgetRegistry.register({ manifest: pricesManifest, component: PricesWidget });
WidgetRegistry.register({ manifest: notesManifest, component: NotesWidget });
WidgetRegistry.register({ manifest: launcherManifest, component: LauncherWidget });
WidgetRegistry.register({ manifest: musicManifest, component: MusicWidget });
