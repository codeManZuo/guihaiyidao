import fs from "node:fs";
import path from "node:path";
import { configFromProperties, defaultGameConfig, type GameConfig } from "./gameConfig";
import { parseProperties } from "./properties";

export function loadGameConfigFromRepoRoot(): GameConfig {
  try {
    const filePath = path.resolve(process.cwd(), "../public/config/game.properties");
    const text = fs.readFileSync(filePath, "utf-8");
    const props = parseProperties(text);
    return configFromProperties(props);
  } catch {
    return defaultGameConfig();
  }
}
