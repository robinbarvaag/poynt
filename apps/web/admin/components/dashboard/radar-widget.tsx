import { getBindersWidgetData } from "@/lib/radar/widget-data";
import { BindersWidget } from "./binders-widget";

/**
 * «Bindersen» — innholdsradar-widget på admin-dashbordet (beforeDashboard).
 * Serverdelen henter de mest presserende forslagene + siste kjøring; selve
 * assistenten (animasjon + handlinger) bor i binders-widget.tsx. På alle
 * andre admin-sider vises samme assistent flytende via binders-provider.tsx.
 * Se docs/CONTENT-RADAR.md.
 */
export const RadarWidget = async () => {
  const { suggestions, run } = await getBindersWidgetData();
  return <BindersWidget suggestions={suggestions} run={run} />;
};
