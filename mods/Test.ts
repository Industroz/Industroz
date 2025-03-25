import Game, { Item } from "./Game.js";

import { APIActionRowComponent, APIMessageActionRowComponent, BaseInteraction, ButtonInteraction, Emoji, InteractionReplyOptions, InteractionUpdateOptions, StringSelectMenuInteraction, User, time } from "discord.js";
import { stripIndent } from "common-tags";

import defineEvent from "../resources/Bot/events.js";
import { defineComponents, Component, SelectMenuOption } from "../resources/Bot/components.js";

import { client } from "./../resources/Bot/client.js";

import { World } from "../commands/world.js";
import { _Settings, Settings } from "../commands/settings.js";
import { Marketplace } from "../commands/marketplace.js";
import { Setting } from "./../commands/settings.js";
import { WorldDatabase, SettingsDatabase, MarketplaceDatabase, ModsDatabase } from "./../databases/Databases.js";
import Mods from "./Mods.js";

interface NavigationButtonData {
    User: string,
    Island: number,
    Position: [number, number]
};
type InteractionResponse = InteractionReplyOptions & InteractionUpdateOptions;

const Test: Game = {
    Configuration: {
        Name: 'Test',
        Description: 'Test',
        Version: '1.0.0-beta',
        Logo: '⚙️',
        Author: { Username: 'platformer444', UserID: '1150357997491593247'}
    },
    Resources: {
        Data: {
            Tiles: [
                {
                    ID: 1,
                    Name: 'Water',
                    Description: 'A Pool of a Covalent Chemical Compound formed when Two Atoms of Hydrogen and One Atom of Oxygen share their Electrons',
                    Emoji: '<:Water:1302578527329320960>',
                    Spawnable: 7
                },
                {
                    ID: 2,
                    Name: 'Land',
                    Description: 'Just a Piece of 124×124 Pixels Big Piece of Just Grass... Just Grass... (Mooooo... Bahhhh.... Don\'t let Your Livestock come Here! I made a Mistake You See)',
                    Emoji: '<:Land:1170322862276608100>',
                    Spawnable: 10
                },
                {
                    ID: 3,
                    Name: 'Outpost',
                    Description: '',
                    Emoji: '<:Outpost:1182330497288900728>',
                    Buildable: true,
                    BuildableOn: 2
                },
                {
                    ID: 4,
                    Name: 'Shop',
                    Description: '',
                    Emoji: '<:Shop:1306904457216262224>',
                    Buildable: true,
                    BuildableOn: 2,
                    DestroyReplace: 2,
                    BuyingDetails: [
                        { Item: 1, Quantity: 100 },
                        { Item: 4, Quantity: 10 }
                    ],
                    Salary: [
                        { Item: 1, Quantity: 10 }
                    ]
                },
                {
                    ID: 5,
                    Name: 'Port',
                    Description: '',
                    Emoji: '<:Land:1170322862276608100>',
                    Buildable: true,
                    BuildableOn: 1,
                    DestroyReplace: 1,
                    BuyingDetails: [
                        { Item: 1, Quantity: 100 },
                        { Item: 4, Quantity: 10 }
                    ],
                    Salary: [
                        { Item: 1, Quantity: 10 }
                    ]
                },
                {
                    ID: 6,
                    Name: 'Trees',
                    Description: '',
                    Emoji: '<:Trees:1170322946213036052>',
                    Spawnable: 9,
                    DestroyReplace: 2,
                    DestroyGive: [
                        { Item: 4, Quantity: 2 }
                    ]
                },
                {
                    ID: 7,
                    Name: 'WoodCutter Hut',
                    Description: '',
                    Emoji: '<:WoodcutterHut:1170322950201815091>',
                    Buildable: true,
                    BuildableOn: 6,
                    BuyingDetails: [
                        { Item: 1, Quantity: 5 },
                        { Item: 4, Quantity: 5 }
                    ],
                    DestroyReplace: 4,
                    DestroyGive: [
                        { Item: 1,  Quantity: 2 }
                    ],
                    Salary: [
                        { Item: 1, Quantity: 5 }
                    ],
                    Production: [ { Item: 4 } ]
                },
                {
                    ID: 8,
                    Name: 'Stone',
                    Description: '',
                    Emoji: '<:Stone:1170322935794372608>',
                    Spawnable: 9,
                    DestroyReplace: 2
                },
                {
                    ID: 9,
                    Name: 'Coal',
                    Description: '',
                    Emoji: '<:Coal:1170322867473350686>',
                    Spawnable: 7,
                    DestroyReplace: 2
                },
                {
                    ID: 10,
                    Name: 'Plank Cutter',
                    Description: '',
                    Emoji: '<:PlankCutter:1306904454855000094>',
                    Buildable: true,
                    BuildableOn: 2,
                    BuyingDetails: [
                        { Item: 1, Quantity: 5 },
                        { Item: 4, Quantity: 5 }
                    ],
                    DestroyReplace: 2,
                    DestroyGive: [
                        { Item: 1,  Quantity: 2 }
                    ],
                    Salary: [
                        { Item: 1, Quantity: 5 }
                    ],
                    Production: [ { Item: 5, Consumption: { Item: 4, Quantity: 2 } } ]
                }
            ],

            Biomes: [
                {
                    ID: 1,
                    Name: 'Plains',
                    Tiles: [ 2 ],
                    SpawningChance: 1
                },
                {
                    ID: 2,
                    Name: 'Forest',
                    Tiles: [ 1, 6 ],
                    SpawningChance: 9
                },
                {
                    ID: 3,
                    Name: 'Stony Fields',
                    Tiles: [ 8, 9 ],
                    SpawningChance: 8
                }
            ],

            Items: [
                {
                    ID: 1,
                    Name: 'Coin',
                    Description: 'A Shiny, Golden and Circular In-Game Currency for Industroz.',
                    Emoji: '🪙',
                    Usable: async (interaction, Data) => {
                        await interaction.reply(await Test.Resources.Utilities.PaySalary(Data));
                    }
                },
                {
                    ID: 2,
                    Name: 'Axe',
                    Description: 'A Sharp Piece of Metal attached to a Wooden Stick used to Destroy Wooden Things.',
                    Emoji: '🪓',
                    BuyingDetails: [
                        { Item: 1, Quantity: 1 }
                    ],
                    SellDetails: [
                        { Item: 1, Quantity: 2 }
                    ],
                    Usable: async (interaction, Data) => {
                        const Reply = await Test.Resources.Utilities.DestroyTile(Data, interaction.user, "Axe");
                        if (Reply[0] === "Reply") await interaction.reply(Reply[1]);
                        else if (Reply[0] === "Update") await interaction.update(Reply[1]);
                    }
                },
                {
                    ID: 3,
                    Name: 'Pickaxe',
                    Description: 'A Hard Piece of Metal attached to a Wooden Stick used to Destroy Stone-Like Materials.',
                    Emoji: '⛏️',
                    Usable: async (interaction, Data) => {
                        const Reply = await Test.Resources.Utilities.DestroyTile(Data, interaction.user, "Pickaxe");
                        if (Reply[0] === "Reply") await interaction.reply(Reply[1]);
                        else if (Reply[0] === "Update") await interaction.update(Reply[1]);
                    }
                },
                {
                    ID: 4,
                    Name: 'Wood',
                    Description: 'A Long and Thick Piece of Material obtained by Destroying Trees.',
                    Emoji: '🪵'
                },
                {
                    ID: 5,
                    Name: 'Wood Planks',
                    Description: '',
                    Emoji: '<:WoodenPlanks:1306904459929976892>'
                }
            ],
        },
        Utilities: {
            CreateWorld: (WorldDimensions: [number, number], DefaultOutpostPosition: [number, number] = [(WorldDimensions[0] / 2) - 1, (WorldDimensions[1] / 2) - 1]): World["Islands"][0]["Tiles"] => {
                const World: World["Islands"][0]["Tiles"] = [];
        
                const _Biomes: number[][] = [];
                let BiomeWidth: number = 5;
                let BiomeHeight: number = 5;
        
                for (let i = 1; i <= WorldDimensions[0] / BiomeHeight; i++) {
                    const __Biomes: number[] = [];
        
                    for (let j = 1; j <= WorldDimensions[1] / BiomeWidth; j++) {
                        for (const Biome of Test.Resources.Data.Biomes) {
                            if (Test.Resources.Utilities.RandomNumber(1, Test.Resources.Utilities.RandomNumber(10, 20) - Biome["SpawningChance"]) === 1) {
                                __Biomes.push(Biome["ID"]);
                                break;
                            }
                        }
                    }
        
                    if (__Biomes.length !== WorldDimensions[1] / BiomeWidth) {
                        __Biomes.push(...(new Array((WorldDimensions[1] / BiomeWidth) - __Biomes.length).fill(0)))
                    }
                    _Biomes.push(__Biomes);
                }
        
                for (let i = 0; i < WorldDimensions[0]; i++) {
                    const WorldChunk: World["Islands"][0]["Tiles"][0] = [];
        
                    for (let j = 0; j < WorldDimensions[1]; j++) {
                        let Tile: number | undefined;
        
                        const Biome = Test.Resources.Data.Biomes.filter((Biome) => {
                            return Biome["ID"] === _Biomes[Math.floor(i / BiomeHeight)][Math.floor(j / BiomeWidth)];
                        })[0] ?? { Tiles: [ 2 ] };
        
                        for (let _Tile of Biome["Tiles"]) {
                            const __Tile = Test.Resources.Data.Tiles.filter((__Tile) => { return __Tile["ID"] === _Tile })[0];
        
                            if (__Tile["Spawnable"]) {
                                if (Test.Resources.Utilities.RandomNumber(1, (10 - __Tile["Spawnable"])) === 1) {
                                    Tile = _Tile;
                                    break;
                                }
                            }
                        }
        
                        if (!Tile) WorldChunk.push({ Tile: 2 });
                        else WorldChunk.push({ Tile: Tile });
                    }
        
                    World.push(WorldChunk);
                }
        
                World[DefaultOutpostPosition[0]][DefaultOutpostPosition[1]]["Tile"] = 3;
        
                return World;
            },
            
            RenderWorld: (World: World["Islands"][0]["Tiles"], Position: [number, number], FOV: [number, number] = [5, 5]): string => {
                let message = '';
        
                for (let i = Position[0] - Math.floor(FOV[0] / 2); i < (Position[0] - Math.floor(FOV[0] / 2)) + FOV[0]; i++) {
                    for (let j = Position[1] - Math.floor(FOV[1] / 2); j < (Position[1] - Math.floor(FOV[1] / 2)) + FOV[1]; j++) {
                        let Tile;
        
                        if (!World[i] || !World[i][j]) Tile = Test.Resources.Data.Tiles.filter((Tile) => { return Tile["ID"] === 1 })[0];
                        else Tile = Test.Resources.Data.Tiles.filter((Tile) => { return Tile["ID"] === World[i][j]["Tile"] })[0];
        
                        message += Tile["Emoji"];
                    }
                    message += '\n';
                }
        
                return message;
            },

            NavigateWorld: async (Data: NavigationButtonData, Interactor: User, Move: [number, number]): Promise<InteractionResponse> => {
                return await Test.Resources.Utilities.BuildNavigation(
                    {
                        User: Data["User"],
                        Island: Data["Island"],
                        Position: [Data["Position"][0] + Move[0], Data["Position"][1] + Move[1]]
                    },
                    Interactor
                );
            },

            DestroyTile: async (Data: NavigationButtonData, Interactor: User, Tool: "Axe" | "Pickaxe"): Promise<["Reply" | "Update", InteractionResponse]> => {
                const AxeBreakableBlocks = [ 5, 6 ];
                const PickaxeBreakableBlocks = [ 7, 8 ];
                const World = await WorldDatabase.Get(Data["User"]);
                const CurrentTile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"];

                if ((Tool === "Axe" ? AxeBreakableBlocks : PickaxeBreakableBlocks).includes(CurrentTile as number)) {
                    const Tile = Test.Resources.Data.Tiles.filter((Tile) => { return Tile["ID"] === CurrentTile })[0];

                    World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]] = { Tile: Tile["DestroyReplace"] ?? 2 };

                    Tile["DestroyGive"]?.forEach((Item) => { World["Inventory"] = Test.Resources.Utilities.EditInventory(World["Inventory"], Item["Item"], "Add", Item["Quantity"]); });

                    await WorldDatabase.Set(Data["User"], World);
                    return ["Update", await Test.Resources.Utilities.BuildNavigation(Data, Interactor)];
                }
                else return ["Reply", {
                    content: `${Tool} can't be used on that Tile!`,
                    ephemeral: true
                }];
            },

            PaySalary: async (Data: NavigationButtonData): Promise<InteractionResponse> => {
                const World = await WorldDatabase.Get(Data["User"]);
                        
                const Tile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];
                const _Tile = Test.Resources.Data.Tiles.filter((_Tile) => { return _Tile["ID"] === Tile["Tile"] })[0];
        
                if (!Tile["Component"] || !_Tile["Salary"]) return {
                    content: `You can't Pay Salary to this Tile!`,
                    ephemeral: true
                };
        
                const TimePassed = Math.floor((Date.now() - (Tile["Component"]["LastSalaryPay"])) / (1000 * 60 * 60 * 24));
                if (TimePassed === 0) return {
                    content: `You can Pay Salary only Once per Day!`,
                    ephemeral: true
                };
        
                const [NewInventory, Message] = Test.Resources.Utilities.Pay(World["Inventory"], _Tile["Salary"]);
                if (Message !== '') return { content: Message, ephemeral: true }
        
                Tile["Component"]["Hoarding"].forEach((HoardedStock) => {
                    World["Inventory"] = Test.Resources.Utilities.EditInventory(
                        World["Inventory"],
                        HoardedStock["Item"],
                        "Add",
                        (HoardedStock["Quantity"] - TimePassed) > 0 ? HoardedStock["Quantity"] - TimePassed : 0
                    );
                });
                World["Inventory"] = NewInventory;
                World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Component"] = {
                    ...Tile["Component"],
                    LastSalaryPay: Date.now(),
                    Hoarding: []
                };
                await WorldDatabase.Set(Data["User"], World);
        
                return {
                    content: `Salary for ${_Tile["Emoji"]}${_Tile["Name"]}'s ${Tile["Component"]?.Workers} Workers was Paid Successfully!`,
                    ephemeral: true
                };
            },

            Plural: (Word: string): string => {
                if (Word.endsWith('f')) return `${Word.slice(0, Word["length"] - 1)}ves`;
                else if (Word.endsWith('o')) return `${Word}es`;
                else return `${Word}s`;
            },

            Singular: (Word: string): string => {
                if (Word.endsWith('ves')) return `${Word.slice(0, Word["length"] - 3)}f`;
                else if (Word.endsWith('s')) return Word.slice(0, Word["length"] - 1);
                else return Word;
            },

            RandomNumber: (Min: number, Max: number): number => {
                return Math.floor(Math.random() * (Max - Min + 1) ) + Min;
            },

            BuildHomeScreen: async (User: User, Interactor: User, Island: number, Outpost?: number): Promise<InteractionResponse> => {
                if (User.bot) return {
                    content: 'Bots can not have an Industrial World!',
                    ephemeral: true
                };
        
                const World = await WorldDatabase.Get(User["id"]);
                const Settings = await SettingsDatabase.Get(User["id"]);
        
                if (!World) return {
                    content: 'Looks like the specified User does not have an Industrial World!',
                    ephemeral: true
                };
        
                if(Settings["Visibility"] === "Private") return {
                    content: 'The Specified User\'s Industrial World is Private!',
                    ephemeral: true
                };
        
                if (Island > World["Islands"].length) Island = 1;
        
                Outpost = Outpost ?? 
                    World["Islands"][Island - 1]["Outposts"].indexOf(
                        World["Islands"][Island - 1]["Outposts"].filter((Outpost) => { return Outpost["Default"] })[0]
                    ) + 1;
        
                return {
                    content: Test.Resources.Utilities.RenderWorld(
                        World["Islands"][Island - 1]["Tiles"],
                        World["Islands"][Island - 1]["Outposts"][Outpost - 1]["Location"]
                    ),
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Explore',
                                Label: 'Explore',
                                Emoji: '🗺️',
                                ButtonStyle: "Primary",
                                Data: {
                                    User: User.id,
                                    Island: Island,
                                    Position: World["Islands"][Island - 1]["Outposts"][Outpost - 1]["Location"]
                                }
                            },
                            {
                                ComponentType: "Button",
                                CustomID: 'GetOfflineEarnings',
                                Label: 'Get Offline Earnings',
                                Emoji: '💵',
                                ButtonStyle: "Primary",
                                Disabled: User !== Interactor,
                                Data: { Island: Island }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "StringSelect",
                                CustomID: 'IslandSelect',
                                Placeholder: 'Select an Island...',
                                Options: [
                                    ...World["Islands"].map((_Island) => {
                                        return {
                                            Label: `Island ${_Island["ID"]}`,
                                            Default: Island === _Island["ID"],
                                            Emoji: '🏝️'
                                        }
                                    }),
                                    {
                                        Label: 'Create an Island',
                                        Description: `${(World["Islands"].length + 1) * 100000}`,
                                        Emoji: '➕'
                                    }
                                ],
                                Data: { User: User["id"] }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "StringSelect",
                                CustomID: 'OutpostSelect',
                                Placeholder: 'Select an Outpost...',
                                Options: World["Islands"][Island - 1]["Outposts"].map((_Outpost, Index) => {
                                    return {
                                        Label: `Outpost ${Index + 1}`,
                                        Value: (Index + 1).toString(),
                                        Default: Index + 1 === Outpost,
                                        Emoji: '🔭'
                                    }
                                }),
                                Data: { User: User["id"], Island: Island }
                            }
                        )
                    ],
                    ephemeral: Settings["Visibility"] !== "Public"
                };
            },

            BuildNavigation: async (Data: NavigationButtonData, Interactor: User): Promise<InteractionResponse> => {
                const World = await WorldDatabase.Get(Data["User"]);
        
                const Directions: { Direction: string, Emoji: string }[][] = [
                    [
                        { Direction: 'UL', Emoji: '↖️' },
                        { Direction: 'U', Emoji: '⬆️' },
                        { Direction: 'UR', Emoji: '↗️' }
                    ],
                    [
                        { Direction: 'L', Emoji: '⬅️' },
                        { Direction: 'N', Emoji: '⏹️' },
                        { Direction: 'R', Emoji: '➡️' }
                    ],
                    [
                        { Direction: 'DL', Emoji: '↙️' },
                        { Direction: 'D', Emoji: '⬇️' },
                        { Direction: 'DR', Emoji: '↘️' }
                    ]
                ];
        
                const UsableItems = Test.Resources.Data.Items.filter((Item) => { return Item["Usable"]; });
                return {
                    content: Test.Resources.Utilities.RenderWorld(
                        World["Islands"][Data["Island"] - 1]["Tiles"],
                        Data["Position"]
                    ),
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'TileInfo',
                                Label: `[${String(Data["Position"])}]`,
                                //Emoji: Vanilla.Resources.Data.Tiles.filter((Tile) => { return Tile["ID"] === World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] })[0]["Emoji"],
                                ButtonStyle: "Primary",
                                Disabled: (Data["Position"][0] < 0 || Data["Position"][0] > (World["Islands"][Data["Island"] - 1]["Tiles"].length - 1)) || (Data["Position"][1] < 0 || Data["Position"][1] > (World["Islands"][Data["Island"] - 1]["Tiles"][0].length - 1)),
                                Data: Data
                            },
                            {
                                ComponentType: "Button",
                                CustomID: 'Build',
                                Label: "Build",
                                Emoji: '🛠️',
                                ButtonStyle: "Primary",
                                Disabled: Data["User"] !== Interactor["id"] || ((Data["Position"][0] < 0 || Data["Position"][0] > (World["Islands"][Data["Island"] - 1]["Tiles"].length - 1))  || (Data["Position"][1] < 0 || Data["Position"][1] > (World["Islands"][Data["Island"] - 1]["Tiles"][0].length - 1))),
                                Data: Data
                            },
                            {
                                ComponentType: "Button",
                                CustomID: 'ItemUse',
                                Label: 'Use Item',
                                Emoji: UsableItems[Test.Resources.Utilities.RandomNumber(1, UsableItems["length"]) - 1]["Emoji"],
                                ButtonStyle: "Primary",
                                Disabled: Data["User"] !== Interactor["id"] || ((Data["Position"][0] < 0 || Data["Position"][0] > (World["Islands"][Data["Island"] - 1]["Tiles"].length - 1))  || (Data["Position"][1] < 0 || Data["Position"][1] > (World["Islands"][Data["Island"] - 1]["Tiles"][0].length - 1))),
                                Data: Data
                            }
                        ),
                        ...Directions.map((Directions) => {
                            return defineComponents(
                                ...Directions.map((Direction): Component => {
                                    return {
                                        ComponentType: "Button",
                                        CustomID: 'Nav',
                                        Emoji: Direction["Emoji"],
                                        Disabled: Direction["Direction"] === "N",
                                        ButtonStyle: "Secondary",
                                        Data: {
                                            To: Direction["Direction"],
                                            ...Data
                                        }
                                    };
                                })
                            );
                        }),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Home',
                                Label: 'Home',
                                Emoji: '🏡',
                                ButtonStyle: "Secondary",
                                Data: Data
                            }
                        )
                    ]
                };
            },

            BuildListEmbed: <ListItemType>(
                List: ListItemType[],
                Content: (Item: ListItemType, Index?: number, List?: ListItemType[]) => [string, SelectMenuOption],
                SelectInteractionExecute: (interaction: StringSelectMenuInteraction, Data?: any) => any,
                Options: {
                    Page: number
                    Title?: string,
                    Embed?: boolean,
                    SelectMenu?: boolean,
                    MultiSelectMenu?: number,
                    SelectMenuData?: any
                }
            ): InteractionResponse => {
                defineEvent({
                    Event: "interactionCreate",
                    Name: `${Options["Title"]} Paginate Event`,
                    Execute: async (Utils, GameData, interaction: ButtonInteraction) => {
                        if (interaction.isButton()) {
                            const PaginateID = interaction.customId.split('$')[0];
                            const Page = parseInt(JSON.parse(interaction.customId.split('$')[1])["Page"]);
        
                            if (PaginateID === `${Options["Title"]}Paginate`) return await interaction.update(Utils.BuildListEmbed<ListItemType>(
                                List, Content, SelectInteractionExecute,
                                { ...Options, Page: Page }
                            ));
                        }
                    }
                });
        
                defineEvent({
                    Event: "interactionCreate",
                    Name: `${Options["Title"]} StringSelectMenu Event`,
                    Execute: async (Utils, GameData, interaction: StringSelectMenuInteraction) => {
                        if (interaction.isStringSelectMenu()) {
                            const CustomID = interaction.customId.split('$')[0];
                            const Data = JSON.parse(interaction.customId.split('$')[1]);
        
                            if (CustomID === `${Options["Title"]}StringSelect`) return await SelectInteractionExecute(interaction, Data);
                        }
                    }
                });
        
                return {
                    embeds: (Options["Embed"] ?? true) ? [
                        {
                            title: Options["Title"],
                            description: List
                                .filter((Item): ListItemType | undefined => {
                                    if (
                                        List.indexOf(Item) >= (Options["Page"] - 1) * 25 &&
                                        List.indexOf(Item) <= (25 * Options["Page"]) - 1
                                    ) return Item;
                                    else return;
                                })
                                .map((Item) => { return Content(Item, List.indexOf(Item), List)[0] }).join('\n')
                        }
                    ] : undefined,
                    
                    components: [
                        ...((Options["SelectMenu"] ?? true) ? [defineComponents(
                            {
                                ComponentType: "StringSelect",
                                CustomID: `${Options["Title"]}StringSelect`,
                                Placeholder: 'Select an Item...',
                                ValuesNumber: [1, Options["MultiSelectMenu"] ?? 1],
                                Options: List
                                    .filter((Item): ListItemType | undefined => {
                                        if (
                                            List.indexOf(Item) >= (Options["Page"] - 1) * 25 &&
                                            List.indexOf(Item) <= (25 * Options["Page"]) - 1
                                        ) return Item;
                                        else return;
                                    })
                                    .map((Item) => { return Content(Item, List.indexOf(Item), List)[1]; }),
                                Data: Options["SelectMenuData"] ?? {}
                            }
                        )] : []),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: `${Options["Title"]}Paginate`,
                                Label: '<< Previous',
                                Disabled: (Options["Page"] - 1) <= 0,
                                ButtonStyle: "Primary",
                                Data: { Page: Options["Page"] - 1 }
                            },
                            {
                                ComponentType: "Button",
                                CustomID: `${Options["Title"]}Paginate`,
                                Label: 'Next >>',
                                Disabled: List.length < Options["Page"] * 25,
                                ButtonStyle: "Primary",
                                Data: { Page: Options["Page"] + 1 }
                            }
                        )
                    ]
                };
            },

            BuildInventoryEmbed: async (interaction: BaseInteraction, Inventory: World["Inventory"]): Promise<InteractionResponse> => {
                const Settings = await SettingsDatabase.Get(interaction.user.id);
            
                return Test.Resources.Utilities.BuildListEmbed<World["Inventory"][0]>(
                    Inventory,
                    (Item) => {
                        const item = Test.Resources.Data.Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
                        return [
                            `${item["Emoji"]} ${Item["Quantity"] > 1 ? Test.Resources.Utilities.Plural(item["Name"]) : item["Name"]} ×${Item["Quantity"]}`,
                            {
                                Label: `${Item["Quantity"] > 1 ? Test.Resources.Utilities.Plural(item["Name"]) : item["Name"]}(×${Item["Quantity"]})`,
                                Value: `${Item["Quantity"] > 1 ? Test.Resources.Utilities.Plural(item["Name"]) : item["Name"]}(×${Item["Quantity"]})`,
                                Description: item["Description"],
                                Emoji: item["Emoji"]
                            }
                        ];
                    },
                    async (interaction) => {
                        const Item = Test.Resources.Data.Items.filter((Item) => { return Item["Name"] === Test.Resources.Utilities.Singular(interaction.values[0].split('(')[0]) })[0];
                        return await interaction.update(await Test.Resources.Utilities.BuildInventoryItemEmbed(interaction.user.id, Item["ID"], parseInt(interaction.values[0].split('(')[1].replace('×', '').replace(')', ''))));
                    },
                    {
                        Title: `${Settings["DisplayName"]}'s Inventory`,
                        Page: 1
                    }
                )
            },

            BuildInventoryItemEmbed: async (UserID: string, Item: number, Quantity: number): Promise<InteractionResponse> => {
                const World = await WorldDatabase.Get(UserID);
                const Island = World["Islands"].filter((Island) => {
                    const ShopItems = Island["Shop"]["Items"].map((Item) => { return Item["Quantity"] > 0 ? Item["Item"] : 0 });
                    return ShopItems.includes(Item)
                })[0];
        
                const item = Test.Resources.Data.Items.filter((item) => { return item["ID"] === Item })[0];
        
                return {
                    embeds: [
                        {
                            title: `${item["Emoji"]} ${Quantity > 1 ? Test.Resources.Utilities.Plural(item["Name"]) : item["Name"]} (×${Quantity})`,
                            description: item["Description"],
                            footer: {
                                text: stripIndent`
                                    ${!item["BuyingDetails"] ? 'Can\'t be Bought!' : Test.Resources.Utilities.DisplayItemCost(Item, "Items", "BuyingDetails")}
                                    ${!item["SellDetails"] ? 'Can\'t be Sold!' : Test.Resources.Utilities.DisplayItemCost(Item, "Items", "SellDetails")}
                                `
                            }
                        }
                    ],
                    
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Buy',
                                Label: `Buy ${Island ? `(Available in Island ${Island["ID"]}'s Shop)` : '(Not Available in Shops)'}`,
                                Disabled: !item["BuyingDetails"] || !Island,
                                ButtonStyle: "Primary",
                                Data: { Island: (Island ?? { ID: 0 })["ID"], Item: Item }
                            },
                            {
                                ComponentType: "Button",
                                CustomID: 'Sell',
                                Label: 'Sell',
                                Disabled: !item['SellDetails'],
                                ButtonStyle: "Primary",
                                Data: { Item: Item }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Inventory',
                                Label: 'Back to Inventory',
                                ButtonStyle: "Secondary"
                            }
                        )
                    ],
                };
            },

            BuildShopItemEmbed: async (UserID: string, Island: number, Item: number): Promise<InteractionResponse> => {
                const World = await WorldDatabase.Get(UserID);
        
                const ShopItem = World["Islands"][Island - 1]["Shop"]["Items"].filter((ShopItem) => { return ShopItem["Item"] === Item })[0];
                const item = Test.Resources.Data.Items.filter((item) => { return item["ID"] === Item })[0];
        
                return {
                    embeds: [
                        {
                            title: `${item["Emoji"]} ${item["Name"]} (${ShopItem["Quantity"]} Available in Island ${Island}'s Shop)`,
                            description: item["Description"],
                            footer: { text: Test.Resources.Utilities.DisplayItemCost(Item, "Items", "BuyingDetails") }
                        }
                    ],
                    
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Buy',
                                Label: 'Buy',
                                Disabled: !item["BuyingDetails"],
                                ButtonStyle: "Primary",
                                Data: { Island: Island, Item: Item }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Shop',
                                Label: 'Back to Shop',
                                ButtonStyle: "Secondary",
                                Data: { Island: Island }
                            }
                        )
                    ],
                };
            },

            BuildTileInfoEmbed: async (Data: NavigationButtonData, Interactor: User): Promise<InteractionResponse> => {
                const World = await WorldDatabase.Get(Data["User"]);
                const Tile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];
                const _Tile = Test.Resources.Data.Tiles.filter((tile) => { return tile["ID"] === Tile["Tile"] })[0];
        
                return {
                    embeds: [
                        {
                            title: _Tile["Emoji"] + " " + _Tile["Name"],
                            description: `**${_Tile["Description"]}**`,
                            fields: Tile["Component"] ? [
                                { name: 'Level', value: String(Tile["Component"]["Level"]), inline: true },
                                { name: 'Workers', value: String(Tile["Component"]["Workers"]), inline: true },
                                { name: 'Last Salary Pay', value: String(time(Math.floor(Tile["Component"]["LastSalaryPay"] / 1000), "F")), inline: true },
        
                                { name: 'Production', value: _Tile["Production"] ? stripIndent`${
                                    _Tile["Production"]?.map((Production) => {
                                        const ProductionItem = Test.Resources.Data.Items.filter((Item) => { return Item["ID"] === Production["Item"] })[0];
                                        const ConsumptionItem = Test.Resources.Data.Items.filter((Item) => { if (Production["Consumption"]) return Item["ID"] === Production["Consumption"]["Item"] })[0];
        
                                        return `${ProductionItem["Emoji"]}×${(Tile["Component"]?.Workers as number) + (Tile["Component"]?.Level as number)} ${Production["Consumption"] ? `(${ConsumptionItem["Emoji"]}-${Production["Consumption"]["Quantity"]})` : ''}`
                                    }).join(',\n')
                                }/worker/min` : 'No Production' },
        
                                { name: 'Upgrade Cost', value: String(Test.Resources.Utilities.DisplayItemCost(Tile["Tile"], "Tiles", "Upgrade", true, Tile["Component"]["Level"] + 1)), inline: true },
                                { name: 'Salary', value: stripIndent`${
                                    _Tile["Salary"]?.map((SalaryItem) => {
                                        const Item = Test.Resources.Data.Items.filter((Item) => { return Item["ID"] === SalaryItem["Item"] })[0];
                                        return `${Item["Emoji"]}×${SalaryItem["Quantity"]}`
                                    }).join(' ')
                                }/worker/day`, inline: true }
                            ] : undefined
                        }
                    ],
        
                    components: Tile["Component"] ? [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Upgrade',
                                Label: 'Upgrade',
                                ButtonStyle: "Primary",
                                Disabled: Data["User"] !== Interactor["id"],
                                Data: Data
                            },
                            {
                                ComponentType: "Button",
                                CustomID: 'Salary',
                                Label: 'Pay Salary',
                                ButtonStyle: "Primary",
                                Disabled: Data["User"] !== Interactor["id"],
                                Data: Data
                            }
                        )
                    ] : undefined
                };
            },

            BuildSettingsEmbed: async (_Settings: _Settings): Promise<InteractionResponse> => {
                return Test.Resources.Utilities.BuildListEmbed<Setting>(
                    Settings,
                    (Item) => {
                        return [
                            `${Item["Emoji"]} ${Item["Name"]}: ${_Settings[Item["Name"]]}`,
                            { Label: Item["Name"], Value: Item["Name"], Description: _Settings[Item["Name"]], Emoji: Item["Emoji"] }
                        ];
                    },
                    async (interaction) => {
                        const Setting = Settings.filter((Setting) => { return Setting["Name"] === interaction.values[0] })[0]
                        await interaction.update(Test.Resources.Utilities.BuildSettingEmbed(Setting["Name"], _Settings[Setting["Name"]]));
                    },
                    {
                        Title: `${_Settings["DisplayName"]}'s Settings`,
                        Page: 1
                    }
                );
            },

            BuildSettingEmbed: (Setting: keyof _Settings, Value: string): InteractionResponse => {
                const _Setting = Settings.filter((_Setting) => { return _Setting["Name"] === Setting })[0];

                return {
                    embeds: [
                        {
                            title: _Setting["Emoji"] + ' ' + _Setting["Name"],
                            description: _Setting["Description"],
                            fields: [{ name: 'Current Value', value: Value }]
                        }
                    ],
                    components: [
                        defineComponents(
                            _Setting["Type"] === "Choice" ? {
                                ComponentType: "StringSelect",
                                CustomID: 'UpdateSettingChoice',
                                Placeholder: 'Select a Option...',
                                Options: _Setting["Choices"]?.map((Choice, Index) => {
                                    return { Label: Choice, Default: Value === Choice, Value: String(Index) };
                                }),
                                Data: {
                                    Setting: _Setting["Name"]
                                }
                            } :
                            {
                                ComponentType: "Button",
                                CustomID: 'UpdateSettingCustom',
                                Label: 'Edit',
                                ButtonStyle: "Primary",
                                Data: {
                                    Setting: _Setting["Name"]
                                }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Settings',
                                Label: 'Back to Settings',
                                ButtonStyle: "Secondary"
                            }
                        )
                    ]
                };
            },

            BuildMarketplaceEmbed: async (): Promise<InteractionResponse> => {
                const Marketplace = await MarketplaceDatabase.Get('Global');
                const Settings = await SettingsDatabase.GetAll();
            
                if (Marketplace["Offers"].length === 0) return {
                    content: `There are no Offers Available in the Marketplace Currently!`,
                    ephemeral: true
                };
            
                return Test.Resources.Utilities.BuildListEmbed<Marketplace["Offers"][0]>(
                    Marketplace["Offers"],
                    (Item) => {
                        const OfferItemsString = Item["Items"].map((_Item) => {
                            const item = Test.Resources.Data.Items.filter((item) => { return item["ID"] === _Item["Item"]["Item"] })[0];
                            return item["Emoji"];
                        }).join(', ');
            
                        return [
                            `**${Settings[Item["User"]]["DisplayName"]}**: ${Item["Items"].length} ${Item["Items"].length > 1 ? 'Offers' : 'Offer'} Available (${OfferItemsString})`,
                            {
                                Label: Settings[Item["User"]]["DisplayName"],
                                Description: `${Item["Items"].length} ${
                                    Item["Items"].length > 1 ? 'Offers' : 'Offer'
                                } Available`,
                                Value: Item["User"]
                            }
                        ];
                    },
                    async (interaction) => {
                        await interaction.update(await Test.Resources.Utilities.BuildMarketplaceUserEmbed(interaction.values[0]));
                    },
                    { Title: 'Marketplace', Page: 1 }
                );
            },

            BuildMarketplaceUserEmbed: async (User: string): Promise<InteractionResponse> => {
                const Marketplace = await MarketplaceDatabase.Get('Global');
                const Settings = await SettingsDatabase.GetAll();
                const UserOffers = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === User; })[0];
        
                if (UserOffers === undefined) return {
                    content: `The Specified User has no Offers Available!`,
                    ephemeral: true
                };
        
                const Reply = Test.Resources.Utilities.BuildListEmbed<typeof UserOffers["Items"][0]>(
                    UserOffers["Items"],
                    (Item, Index) => {
                        const OfferItem = Test.Resources.Data.Items.filter((OfferItem) => { return OfferItem["ID"] === Item["Item"]["Item"]; })[0];
                        const BuyItem = Test.Resources.Data.Items.filter((BuyItem) => { return BuyItem["ID"] === Item["Cost"]["Item"]; })[0];
        
                        return [
                            `${(Index as number) + 1}. ${BuyItem["Emoji"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Emoji"]} ×${Item["Item"]["Quantity"]})}**)`,
                            {
                                Label: `${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`,
                                Value: String(Index)
                            }
                        ];
                    },
                    async (interaction) => {
                        return await interaction.update(await Test.Resources.Utilities.BuildMarketplaceOfferEmbed(User, interaction.user.id, Number(interaction.values[0])));
                    },
                    { Title: `${Settings[User]["DisplayName"]}`, Page: 1 }
                );
                (Reply["components"] as APIActionRowComponent<APIMessageActionRowComponent>[]).push(
                    defineComponents(
                        {
                            ComponentType: "Button",
                            CustomID: 'Marketplace',
                            Label: 'Back to Marketplace',
                            ButtonStyle: "Secondary"
                        }
                    )
                );
        
                return Reply;
            },

            BuildMarketplaceOfferEmbed: async (User: string, Interactor: string, Offer: number): Promise<InteractionResponse> => {
                const Marketplace = await MarketplaceDatabase.Get('Global');
                const Settings = await SettingsDatabase.GetAll();
                const UserOffer = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === User; })[0];
        
                if (UserOffer === undefined) return {
                    content: `The Specified Offer doesn't Exist!`,
                    ephemeral: true
                };
        
                const _Offer = UserOffer["Items"][Offer];
        
                const OfferItem = Test.Resources.Data.Items.filter((OfferItem) => { return OfferItem["ID"] === _Offer["Item"]["Item"]; })[0];
                const BuyItem = Test.Resources.Data.Items.filter((BuyItem) => { return BuyItem["ID"] === _Offer["Cost"]["Item"]; })[0];
                return {
                    embeds: [
                        {
                            title: `${Settings[User]["DisplayName"]}'s Offer ${Offer + 1}`,
                            fields: [
                                { name: 'You Give:', value: `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${_Offer["Cost"]["Quantity"]}`, inline: true },
                                { name: 'Your Receive:', value: `${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${_Offer["Item"]["Quantity"]}`, inline: true }
                            ]
                        }
                    ],
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'BuyOffer',
                                Label: stripIndent`Buy ${User === Interactor ? '(You can\'t Buy Your Own Offer!)': '' }`,
                                ButtonStyle: "Primary",
                                Disabled: User === Interactor,
                                Data: { User: User, Offer: Offer }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'MarketplaceUser',
                                Label: 'Back to User Offers',
                                ButtonStyle: "Secondary",
                                Data: { User: User }
                            }
                        )
                    ]
                };
            },

            BuildModEmbed: async (User: string, Mod: string): Promise<InteractionResponse> => {
                const UserMod = await ModsDatabase.Get(User);
                const MOD: Game = (await import(`./${Mod}.js`)).default;

                const ModAuthor = await client.users.fetch(MOD.Configuration.Author.UserID);

                return {
                    embeds: [
                        {
                            title: MOD.Configuration.Name + ' ' + MOD.Configuration.Logo,
                            description: MOD.Configuration.Description,
                            author: { name: ModAuthor.username, icon_url: ModAuthor.avatarURL() ?? "" },
                            fields: [
                                { name: 'Version', value: MOD.Configuration.Version }
                            ]
                        }
                    ],
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'ApplyMod',
                                Label: `Apply Mod`,
                                ButtonStyle: "Primary",
                                Disabled: Mod === UserMod,
                                Data: { Mod: Mod }
                            }
                        )
                    ]
                };
            },

            BuildModsEmbed: async (): Promise<InteractionResponse> => {
                return Test.Resources.Utilities.BuildListEmbed<Game>(
                    Mods,
                    (Item) => {
                        return [
                            `${Item.Configuration.Logo} ${Item.Configuration.Name} - ${Item.Configuration.Author.Username}`,
                            { Label: Item.Configuration.Name, Value: Item.Configuration.Name, Emoji: Item.Configuration.Logo, Description: Item.Configuration.Author.Username }
                        ];
                    },
                    async (interaction) => {
                        const Reply = await Test.Resources.Utilities.BuildModEmbed(interaction.user.id, interaction.values[0]);

                        await interaction.update({
                            embeds: Reply["embeds"] ?? [],
                            components: [
                                ...(Reply["components"] ?? []),
                                defineComponents(
                                    {
                                        ComponentType: "Button",
                                        CustomID: 'Mods',
                                        Label: 'Back',
                                        ButtonStyle: "Secondary"
                                    }
                                )
                            ]
                        });
                    },
                    { Title: 'Mods', Page: 1 }
                );
            },

            EditInventory: (InventoryList: World["Inventory"], Item: number, AddorRemove: "Add" | "Remove", Quantity: number): World["Inventory"] => {
                const NewInventory: World["Inventory"] = [];
                let Done = false;
        
                InventoryList.forEach((InventoryItem, Index) => {
                    if (InventoryItem["Item"] === Item) {
                        Done = true;
                        
                        if (AddorRemove === "Add") NewInventory.push({ Item: Item, Quantity: InventoryItem["Quantity"] + Quantity });
                        else {
                            if (InventoryItem["Quantity"] - Quantity === 0) InventoryList.splice(Index, 1);
                            else if (InventoryItem["Quantity"] - Quantity < 0) Done = false;
                            else NewInventory.push({ Item: Item, Quantity: InventoryItem["Quantity"] - Quantity });
                        }
                    } else NewInventory.push(InventoryItem);
                });
        
                if (!Done) {
                    if (AddorRemove === "Add" && Quantity > 0) NewInventory.push({ Item: Item, Quantity: Quantity });
                    else return [];
                }
        
                return NewInventory;
            },

            DisplayItemCost: (ID: number, List: "Tiles" | "Items", Detail: "SellDetails" | "BuyingDetails" | "Upgrade", Emoji: boolean = false, UpgradeLevel?: number): string => {
                const Filtered = (List === "Tiles" ? Test.Resources.Data.Tiles : Test.Resources.Data.Items).filter((_ID) => { return _ID["ID"] === ID })[0];
        
                return stripIndent`
                    ${
                        (List === "Tiles" ? Test.Resources.Utilities.GetUpgradeCost(Filtered["ID"], UpgradeLevel ?? 1) : (Filtered as Item)[Detail === "Upgrade" ? "BuyingDetails" : Detail])?.map((Detail) => {
                            const DetailItem = Test.Resources.Data.Items.filter((DetailItem) => { return DetailItem["ID"] === Detail["Item"]; })[0];
        
                            return `${Emoji ? DetailItem["Emoji"] : DetailItem["Name"]} ×${Detail["Quantity"]}`
                        }).join(' ')
                    }${Detail === "BuyingDetails" ? ` → ${Emoji ? Filtered["Emoji"] : Filtered["Name"]} ×1` : ''}
                `;
            },

            GetUpgradeCost: (Buildable: number, Level: number): { Item: number, Quantity: number }[] | undefined => {
                return Test.Resources.Data.Tiles.filter((Tile) => { return Tile["ID"] === Buildable; })[0]
                    .BuyingDetails?.map((Detail) => {
                        return { Item: Detail["Item"], Quantity: Detail["Quantity"] * Math.pow(2, Level - 1) };
                    });
            },

            Pay: (Inventory: World["Inventory"], CostItems: { Item: number, Quantity: number }[]): [World["Inventory"], string] => {
                const NewInventory: World["Inventory"] = Inventory;
                let Done = false;
                let Message: string = '';
                CostItems.forEach(async (Cost) => {
                    const Temp = Test.Resources.Utilities.EditInventory(Inventory, Cost["Item"], "Remove", Cost["Quantity"]);
        
                    if (Temp["length"] === 0) {
                        const Item = Test.Resources.Data.Items.filter((Item) => { return Item["ID"] === Cost["Item"] })[0];
        
                        Done = false;
                        Message = `You don't have enough ${Item["Emoji"]} ${Item["Name"]} to Complete this Payment!`!;
                        return false;
                    }
                    else {
                        Temp.forEach((InvItem) => {
                            NewInventory.forEach((NewInvItem) => {
                                if (NewInvItem["Item"] === InvItem["Item"]) NewInvItem["Quantity"] = InvItem["Quantity"];
                            });
                        });
                        Done = true;
                    }
                });
        
                return [
                    Done ? NewInventory : Inventory,
                    Message
                ];
            },

            Mod: { }
        }
    }
};

export default Test;