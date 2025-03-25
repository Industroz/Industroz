import DataBase from "./Database.js";
import { _Settings } from "./../commands/settings.js";
import { World } from "./../commands/world.js";
import { Marketplace } from "./../commands/marketplace.js";

const WorldDatabase: DataBase<World> = new DataBase('World');
const SettingsDatabase: DataBase<_Settings> = new DataBase('Settings');
const MarketplaceDatabase: DataBase<Marketplace> = new DataBase('Marketplace');
const ModsDatabase: DataBase<string> = new DataBase('Mods');

WorldDatabase.Init();
SettingsDatabase.Init();
MarketplaceDatabase.Init();
ModsDatabase.Init();

export { WorldDatabase, SettingsDatabase, MarketplaceDatabase, ModsDatabase };