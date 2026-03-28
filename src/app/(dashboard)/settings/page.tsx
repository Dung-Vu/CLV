import { prisma } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  let prefs = await prisma.userPrefs.findFirst();
  if (!prefs) {
    prefs = await prisma.userPrefs.create({ data: {} });
  }

  return <SettingsClient initialPrefs={prefs} />;
}
