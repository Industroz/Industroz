import { BaseInteraction, InteractionReplyOptions, InteractionUpdateOptions, StringSelectMenuInteraction, User } from "discord.js"

import { World } from "commands/world.js"
import { SelectMenuOption } from "../resources/Bot/components.js";
import { _Settings } from "commands/settings.js";

interface NavigationButtonData {
    User: string,
    Island: number,
    Position: [number, number]
};
type InteractionResponse = InteractionReplyOptions & InteractionUpdateOptions;
type ItemQuantityPair = { Item: number, Quantity: number };

export interface Tile {
    ID: number,
    Name: string,
    Description: string,
    Emoji: string,
    Spawnable?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    Buildable?: boolean,
    BuildableOn?: number,
    BuyingDetails?: ItemQuantityPair[],
    DestroyReplace?: number,
    DestroyGive?: ItemQuantityPair[],
    Salary?: ItemQuantityPair[],
    Production?: { Item: number, Consumption?: ItemQuantityPair }[]
};

export interface Biome {
    ID: number,
    Name: string,
    Tiles: number[],
    SpawningChance: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
}

export interface Item {
    ID: number,
    Name: string,
    Description: string,
    Emoji: string,
    SellDetails?: ItemQuantityPair[],
    BuyingDetails?: ItemQuantityPair[],
    Usable?: (interaction: StringSelectMenuInteraction, Data: { User: string, Island: number, Position: [number, number] }) => Promise<void>
};

export default interface Game {
    Configuration: {
        Name: string,
        Description: string,
        Version: string,
        Logo: string
        Author: { Username: string, UserID: string }
    },
    Resources: {
        Data: {
            Tiles: Tile[],
            Biomes: Biome[],
            Items: Item[],
        },
        Utilities: {
            CreateWorld: (WorldDimensions: [number, number], DefaultOutpostPosition?: [number, number]) => World["Islands"][0]["Tiles"],
            RenderWorld: (World: World["Islands"][0]["Tiles"], Position: [number, number], FOV?: [number, number]) => string,
            NavigateWorld: (Data: NavigationButtonData, Interactor: User, Move: [number, number]) => Promise<InteractionResponse>,
            DestroyTile: (Data: NavigationButtonData, Interactor: User, Tool: "Axe" | "Pickaxe") => Promise<["Reply" | "Update", InteractionResponse]>,
            PaySalary: (Data: NavigationButtonData) => Promise<InteractionResponse>,

            Plural: (Word: string) => string,
            Singular: (Word: string) => string,
            RandomNumber: (Min: number, Max: number) => number,

            BuildHomeScreen: (User: User, Interactor: User, Island: number, Outpost?: number) => Promise<InteractionResponse>,
            BuildNavigation: (Data: NavigationButtonData, Interactor: User) => Promise<InteractionResponse>,
            BuildListEmbed: <ListItemType>(
                List: ListItemType[],
                Content: (Item: ListItemType, Index?: number, List?: ListItemType[]) => [string, SelectMenuOption],
                SelectInteractionExecute: (interaction: StringSelectMenuInteraction, Data?: any) => any | Promise<any>,
                Options: {
                    Embed?: boolean,
                    SelectMenu?: boolean,            
                    Title?: string,
                    Page: number,
                    MultiSelectMenu?: number,
                    SelectMenuData?: any
                }
            ) => InteractionResponse,
            BuildInventoryEmbed: (interaction: BaseInteraction, Inventory: World["Inventory"]) => Promise<InteractionResponse>,
            BuildInventoryItemEmbed: (UserID: string, Item: number, Quantity: number) => Promise<InteractionResponse>,
            BuildShopItemEmbed: (UserID: string, Island: number, Item: number) => Promise<InteractionResponse>,
            BuildTileInfoEmbed: (Data: NavigationButtonData, Interactor: User) => Promise<InteractionResponse>,
            BuildSettingsEmbed: (Settings: _Settings) => Promise<InteractionResponse>,
            BuildSettingEmbed: (Setting: keyof _Settings, Value: string) => InteractionResponse,
            BuildMarketplaceEmbed: () => Promise<InteractionResponse>,
            BuildMarketplaceUserEmbed: (User: string) => Promise<InteractionResponse>,
            BuildMarketplaceOfferEmbed: (User: string, Interactor: string, Offer: number) => Promise<InteractionResponse>,
            BuildModEmbed: (User: string, Mod: string) => Promise<InteractionResponse>,
            BuildModsEmbed: () => Promise<InteractionResponse>,

            EditInventory: (InventoryList: World["Inventory"], Item: number, AddorRemove: "Add" | "Remove", Quantity: number) => World["Inventory"],
            DisplayItemCost: (ID: number, List: "Tiles" | "Items", Detail: "SellDetails" | "BuyingDetails" | "Upgrade", Emoji?: boolean, UpgradeLevel?: number) => string,
            GetUpgradeCost: (Buildable: number, Level: number) => { Item: number, Quantity: number }[] | undefined,
            Pay: (Inventory: World["Inventory"], Items: { Item: number, Quantity: number }[]) => [World["Inventory"], string],

            Mod?: { [Util: string]: Function }
        }
    }
};