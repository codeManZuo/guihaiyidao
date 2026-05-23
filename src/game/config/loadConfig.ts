import { configFromProperties, defaultGameConfig, type GameConfig } from "./gameConfig";
import { parseProperties } from "./properties";

export async function loadGameConfig(): Promise<GameConfig> {
  try {
    const res = await fetch("/config/game.properties", { cache: "no-store" });
    if (!res.ok) return defaultGameConfig();
    const text = await res.text();
    const props = parseProperties(text);
    return configFromProperties(props);
  } catch {
    return defaultGameConfig();
  }
}
