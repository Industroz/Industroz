import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

import { client } from "./../resources/Bot/client.js";
import { defineComponents, SelectMenuOption } from "./../resources/Bot/components.js";
import defineEvent from "./../resources/Bot/events.js";

import { World } from "../commands/world.js";
import { Tile } from "./../mods/Game.js";
import { WorldDatabase, SettingsDatabase, ModsDatabase } from "./../databases/Databases.js";

defineEvent({
    Event: "interactionCreate",
    Name: "World Button Interactions",
    
    Execute: async (Utils, GameData, interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === "WorldCreateCancel") {
                return await interaction.update({
                    content: `~~${interaction.message.content}~~`,
                    components: []
                });
            }

            else if (CustomID === "WorldCreateConfirm") {
                await WorldDatabase.Set(interaction.user.id, {
                    Islands: [
                        {
                            ID: 1,
                            Tiles: Utils.CreateWorld([100, 100]),
                            Outposts: [{
                                Location: [49, 49],
                                Default: true
                            }],
                            Shop: {
                                Items: GameData.Items.filter((Item) => { return Item["BuyingDetails"] }).map((Item) => {
                                    return {
                                        Item: Item["ID"],
                                        Quantity: 0
                                    }
                                }),
                                RestockNum: 0,
                                LastRestockTime: 0
                            }
                        }
                    ],
                    Inventory: [
                        { Item: 1, Quantity: 10000000000 },
                        { Item: 2, Quantity: 10 },
                        { Item: 3, Quantity: 10 },
                        { Item: 4, Quantity: 1000 }
                    ],
                    LastOnlineTime: Date.now(),
                    MaxMarketplaceNum: 0
                });

                await SettingsDatabase.Set(interaction.user.id, {
                    Visibility: Data["Visibility"],
                    DisplayName: interaction.user.username
                });

                await ModsDatabase.Set(interaction.user.id, Data["Mod"])

                return await interaction.update({
                    content: (Data["WorldExists"] ?
                        `Your Industrial World has been resetted successfully` : 'A New Industrial World has been created successfully') +
                        `\n\nView Your New World with </world view:${
                            ((await client.application?.commands.fetch())?.filter((Command) => { return Command.name === 'world' }).at(0))?.id
                        }>` + 
                        `\nView the Your World Settings with </settings:${
                            ((await client.application?.commands.fetch())?.filter((Command) => { return Command.name === 'settings' }).at(0))?.id
                        }>` + 
                        `\nView the Your Mods with </mods:${
                            ((await client.application?.commands.fetch())?.filter((Command) => { return Command.name === 'mods' }).at(0))?.id
                        }>`,
                    components: []
                });
            }

            else if (CustomID === "Explore") return await interaction.update(await Utils.BuildNavigation(Data, interaction.user));

            else if (CustomID === "Build") return await interaction.update({
                components: [
                    ...(Utils.BuildListEmbed<Tile>(
                        GameData.Tiles.filter((Tile) => { return Tile["Buildable"] ?? false }),
                        (Item) => {
                            const CostString = Utils.DisplayItemCost(Item["ID"], "Tiles", "BuyingDetails");
                            return [
                                '',
                                { Label: Item["Name"], Value: `${Item["ID"]}`, Description: CostString.includes('undefined') ? Item["Description"] : CostString, Emoji: Item["Emoji"] }
                            ];
                        },
                        async (interaction, Data) => {
                            const World = await WorldDatabase.Get(interaction.user.id);
                            const Buildable = GameData.Tiles.filter((Tile) => { return Tile["ID"] === parseInt(interaction.values[0]) })[0];

                            if (Buildable["BuildableOn"]) {
                                if (World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] !== Buildable["BuildableOn"]) {
                                    const Tile = GameData.Tiles.filter((Tile) => { return Tile["ID"] === Buildable["BuildableOn"] })[0];
                                    return await interaction.reply({
                                        content: `${Buildable["Emoji"]} ${Buildable["Name"]} can be Build on ${Tile["Emoji"]} ${Tile["Name"]} only!`,
                                        ephemeral: true
                                    });
                                }
                            }

                            let Productions = GameData.Tiles.filter((Tile) => { return Tile["ID"] === Buildable["ID"] })[0]["Production"];

                            await interaction.update({
                                components: [
                                    ...(Utils.BuildListEmbed<{Item: number, Consumption?: { Item: number, Quantity: number }}>(
                                        Productions ?? [{ Item: 0 }],
                                        (Production) => {
                                            const ProductionItem = GameData.Items.filter((Item) => { return Item["ID"] === Production["Item"] })[0] ?? { Name: 'No Consumption', Description: `${Buildable["Name"]} has no productions! Select this to Continue!`, Emoji: '❌' };
                                            const ConsumptionItem = Production["Consumption"] ? GameData.Items.filter((Item) => { return Item["ID"] === Production["Consumption"]?.Item })[0] : undefined;

                                            return [
                                                '',
                                                { Label: ProductionItem["Name"], Values: `${Production["Item"]}`, Description: ConsumptionItem ? `${ConsumptionItem["Name"]} ×${Production["Consumption"]?.Quantity as number}` : ProductionItem["Description"], Emoji: ProductionItem["Emoji"] }
                                            ]
                                        },
                                        async (interaction) => {
                                            const [NewInventory, Message] = Utils.Pay(World["Inventory"], Buildable["BuyingDetails"] ?? []);
                                            if (Message !== '') return await interaction.reply({
                                                content: Message,
                                                ephemeral: true
                                            });

                                            if (Buildable["ID"] === 3) World["Islands"][Data["Island"] - 1]["Outposts"].push({
                                                Location: [Data["Position"][0], Data["Position"][1]],
                                                Default: false
                                            });
                                            else if (Buildable["ID"] === 4) {
                                                World["Islands"][Data["Island"] - 1]["Shop"]["Items"].forEach((Item) => { Item["Quantity"] += 10 });
                                                World["Islands"][Data["Island"] - 1]["Shop"]["RestockNum"] += 10;
                                                World["Islands"][Data["Island"] - 1]["Shop"]["LastRestockTime"] = Date.now();
                                            }
                                            else if (Buildable["ID"] === 5) World["MaxMarketplaceNum"] += 10;
                                            
                                            World["Inventory"] = NewInventory;
                                            World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]] = ![3].includes(Buildable["ID"]) ? { Tile: Buildable["ID"], Component: { Level: 1, Production: interaction.values.map((Production) => { return parseInt(Production); }), Workers: 1, LastSalaryPay: Date.now(), Hoarding: [] } } : { Tile: Buildable["ID"] };
                                            await WorldDatabase.Set(interaction.user.id, World);
                    
                                            return await interaction.update(await Utils.BuildNavigation(Data, interaction.user));
                                        },
                                        { Embed: false, MultiSelectMenu: ((Productions?.length as number) > 25 ? 25 : Productions?.length), Title: 'Production', Page: 1 }
                                    )["components"] ?? []),
                                    defineComponents(
                                        {
                                            ComponentType: "Button",
                                            CustomID: 'Explore',
                                            Label: 'Back',
                                            Emoji: '↩️',
                                            ButtonStyle: "Primary",
                                            Data: Data
                                        }
                                    )
                                ]
                            });
                        },
                        {
                            Embed: false,
                            Title: 'BuildablesSelect',
                            Page: 1,
                            SelectMenuData: Data
                        }
                    )["components"] ?? []),
                    defineComponents(
                        {
                            ComponentType: "Button",
                            CustomID: 'Explore',
                            Label: 'Back',
                            Emoji: '↩️',
                            ButtonStyle: "Primary",
                            Data: Data
                        }
                    )
                ]
            });

            else if (CustomID === "ItemUse") {
                const Inventory = (await WorldDatabase.Get(interaction.user.id))["Inventory"];
                const UsableItems = Inventory.filter((InvItem) => {
                    const Item = GameData.Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                    if (Item["Usable"]) return InvItem;
                });

                if (UsableItems["length"] === 0) return await interaction.reply({
                    content: `You don't have any Usable Items!`,
                    ephemeral: true
                });
                else return await interaction.update({
                    components: [
                        ...(Utils.BuildListEmbed<World["Inventory"][0]>(
                            UsableItems,
                            (Item) => {
                                const _Item = GameData.Items.filter((_Item) => { return _Item["ID"] === Item["Item"] })[0];

                                return [
                                    '',
                                    { Label: _Item["Name"], Value: _Item["Name"], Description: _Item["Description"], Emoji: _Item["Emoji"] }
                                ];
                            },
                            async (interaction, Data) => {
                                const Item = GameData.Items.filter((Item) => { return Item["Name"] === interaction.values[0]; })[0];
            
                                if (Item.Usable) {
                                    await Item.Usable(interaction, Data);

                                    const World = await WorldDatabase.Get(Data["User"]);
                                    World["Inventory"] = Utils.EditInventory(World["Inventory"], Item["ID"], "Remove", 1);
            
                                    return await WorldDatabase.Set(Data["User"], World);
                                }
                            },
                            {
                                Embed: false,
                                Title: 'ItemUse',
                                Page: 1,
                                SelectMenuData: Data
                            }
                        )["components"] ?? []),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Explore',
                                Label: 'Back',
                                Emoji: '↩️',
                                ButtonStyle: "Primary",
                                Data: Data
                            }
                        )
                    ]
                });
            }

            else if (CustomID === "Home") return await interaction.update(await Utils.BuildHomeScreen(await client.users.fetch(Data["User"]), interaction.user, Data["Island"]));

            else if (CustomID === "Nav") {
                if (Data["To"] === "L") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [0, -1]));
                else if (Data["To"] === "R") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [0, 1]));
                else if (Data["To"] === "D") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [1, 0]));
                else if (Data["To"] === "U") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [-1, 0]));
                else if (Data["To"] === "DL") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [1, -1]));
                else if (Data["To"] === "DR") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [1, 1]));
                else if (Data["To"] === "UL") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [-1, -1]));
                else if (Data["To"] === "UR") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [-1, 1]));
            }

           else if (CustomID === "GetOfflineEarnings") {
                const World = await WorldDatabase.Get(interaction.user.id);

                const Productions: Array<{ Buildable: number, Location: [number, number], Production: Array<{ Item: number, Amount: number, Consumption?: { Item: number, Quantity: number } } | "Hoarded"> }> = [];
                const SelectMenuOptions: SelectMenuOption[] = [];

                const TimePassed = Math.floor((Date.now() - World["LastOnlineTime"]) / (1000 * 60));

                World["LastOnlineTime"] = Date.now();

                World["Islands"][Data["Island"] - 1]["Tiles"].forEach((_Tiles, Index1) => {
                    _Tiles.filter((Tile) => { return Tile["Component"]; }).forEach((Tile) => {
                        const _Tile = GameData.Tiles.filter((tile) => { return tile["ID"] === Tile["Tile"] })[0];

                        _Tile["Production"]?.filter((Production) => { return Tile["Component"]?.Production.includes(Production["Item"]); }).forEach((Production) => {
                            let Produce = 0;

                            const SalaryPaid = (Date.now() - (Tile["Component"]?.LastSalaryPay as number)) / (1000 * 60 * 60 * 24) < 1;

                            let Consumption;
                            if (Production["Consumption"]) {
                                let Consume = (Production["Consumption"]["Quantity"] + ((Tile["Component"]?.Workers as number) - Utils.RandomNumber(1, (Tile["Component"]?.Workers as number) - Utils.RandomNumber(1, Tile["Component"]?.Level as number))) + (Tile["Component"]?.Level as number)) * TimePassed;
                                const Quantity = (World["Inventory"].filter((InvItem) => { if (Production["Consumption"]) return Production["Consumption"]["Item"] === InvItem["Item"]; })[0] ?? { Quantity: 0 })["Quantity"];
                                
                                if (Consume > Quantity) Consume = Quantity;

                                World["Inventory"] = Utils.EditInventory(World["Inventory"], Production["Consumption"]["Item"], "Remove", Consume);

                                Produce = Consume / Production["Consumption"]["Quantity"];

                                Consumption = { Item: Production["Consumption"]["Item"], Quantity: Consume };
                            }
                            else Produce = TimePassed * ((Tile["Component"]?.Workers as number) - Utils.RandomNumber(1, (Tile["Component"]?.Workers as number) - Utils.RandomNumber(1, Tile["Component"]?.Level as number))) + (Tile["Component"]?.Level as number)

                            World["Inventory"] = Utils.EditInventory(
                                World["Inventory"],
                                Production["Item"],
                                "Add",
                                Produce
                            );

                            const ExistingProducer = Productions.filter((Producer) => {
                                return Producer["Location"][0] === Index1 && Producer["Location"][1] === _Tiles.indexOf(Tile);
                            })[0];

                            if (!ExistingProducer) Productions.push({
                                Buildable: _Tile["ID"],
                                Location: [Index1, _Tiles.indexOf(Tile)],
                                Production: [SalaryPaid ? { Item: Production["Item"], Amount: Produce, Consumption: Consumption } : "Hoarded"]
                            });
                            else Productions.splice(
                                Productions.indexOf(ExistingProducer),
                                1,
                                {
                                    ...ExistingProducer,
                                    Production: [...ExistingProducer["Production"], SalaryPaid ? { Item: Production["Item"], Amount: Produce, Consumption: Consumption } : "Hoarded"]
                                }
                            );

                            if (!SalaryPaid) {
                                Tile["Component"]?.Hoarding.push({ Item: Production["Item"], Quantity: TimePassed });
                                SelectMenuOptions.push({
                                    Label: _Tile["Name"],
                                    Value: `${Data["Island"]}$[${[Index1, _Tiles.indexOf(Tile)]}]$${_Tile["ID"]}`,
                                    Description: `Island ${Data["Island"]} → [${[Index1, _Tiles.indexOf(Tile)]}]`,
                                    Emoji: _Tile["Emoji"]
                                });
                            }
                        });
                    });
                });

                await WorldDatabase.Set(interaction.user.id, World);

                let Message = `**Production for Island ${Data["Island"]}**`;
                if (Productions.length > 0) {
                    Productions.forEach((Production) => {
                        const Buildable = GameData.Tiles.filter((Tile) => { return Tile["ID"] === Production["Buildable"] })[0];
                        let MessageLine = `${Buildable["Emoji"]} ([${Production["Location"]}]) →`;

                        if (Production["Production"][0] !== "Hoarded") Production["Production"].forEach((Produce) => {
                            if (Produce && Produce !== "Hoarded") {
                                const ProductionItem = GameData.Items.filter((Item) => { return Item["ID"] === Produce["Item"] })[0];
                                const ConsumptionItem = GameData.Items.filter((Item) => { if (Produce["Consumption"]) return Item["ID"] === Produce["Consumption"]["Item"] })[0];

                                MessageLine += `${ProductionItem["Emoji"]} +${Produce["Amount"]} ${Produce["Consumption"] ? `(${ConsumptionItem["Emoji"]} -${Produce["Consumption"]["Quantity"]})` : ''}`;
                            }
                        });
                        else MessageLine += ` *Stocks Hoarded! Pay Salary to the Workers to Receive!*`;

                        Message += `\n> ${MessageLine}`;
                    });
                } else Message += `\n> None`

                return await interaction.reply({
                    content: Message,
                    components: SelectMenuOptions["length"] > 0 ? Utils.BuildListEmbed<SelectMenuOption>(
                        SelectMenuOptions,
                        (Item) => {
                            return [
                                '',
                                Item
                            ];
                        },
                        async (interaction) => {
                            const Island = parseInt(interaction.values[0].split('$')[0]);
                            const Location = JSON.parse(interaction.values[0].split('$')[1]);

                            return await interaction.reply(await Utils.PaySalary({
                                User: interaction.user.id,
                                Island: Island,
                                Position: Location
                            }));
                        },
                        {
                            Embed: false,
                            Page: 1
                        }
                    )["components"] : undefined,
                    ephemeral: true
                });
            }

            else if (CustomID === "TileInfo") {
                return await interaction.reply({
                    ephemeral: true,
                    ...(await Utils.BuildTileInfoEmbed(Data, interaction.user))
                });
            }

            else if (CustomID === "Salary") return await interaction.reply(await Utils.PaySalary(Data));

            else if (CustomID === "Upgrade") {
                const World = await WorldDatabase.Get(Data["User"]);
        
                const Tile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];
                const _Tile = GameData.Tiles.filter((_Tile) => { return _Tile["ID"] === Tile["Tile"] })[0];
        
                const [NewInventory, Message] = Utils.Pay(World["Inventory"], Utils.GetUpgradeCost(Tile["Tile"], (Tile["Component"]?.Level as number) + 1) ?? []);
                if (Message) return { content: Message, ephemeral: true };
        
                if (Tile["Component"]) World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Component"] = {
                    ...Tile["Component"],
                    Level: Tile["Component"]["Level"] + 1,
                    Workers: Math.ceil(Tile["Component"]["Workers"] + Utils.RandomNumber(Math.pow(2, Tile["Component"]["Level"] - Utils.RandomNumber(1, 2)), Math.pow(2, Tile["Component"]["Level"])))
                };
                World["Inventory"] = NewInventory;
        
                if (_Tile["ID"] === 4) World["Islands"][Data["Island"] - 1]["Shop"]["RestockNum"] += 10;
                else if (_Tile["ID"] === 5) World["MaxMarketplaceNum"] += 10;
        
                await WorldDatabase.Set(Data["User"], World);
        
                return {
                    content: `Your ${_Tile["Emoji"]}${_Tile["Name"]} was Successfully Upgraded to Level ${Tile["Component"]?.Level as number}!`,
                    ephemeral: true
                };
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'World StringSelectMenu Interaction',
    
    Execute: async (Utils, GameData, interaction: StringSelectMenuInteraction) => {
        if (interaction.isStringSelectMenu()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID ==="IslandSelect") {
                if (interaction.values[0] === 'create_an_island') {
                    const World = await WorldDatabase.Get(Data["User"]);

                    const NewInventory = Utils.EditInventory(World["Inventory"], 1, "Remove", (World["Inventory"]["length"] + 1) * 100000);
                    if (NewInventory["length"] === 0) {
                        const Item = GameData.Items.filter((Item) => { return Item["ID"] === 1 })[0];
                        return await interaction.reply({
                            content: `You don't have Enough ${Item["Emoji"]}${Utils.Plural(Item["Name"])} to Create a New Island!`,
                            ephemeral: true
                        });
                    }
                    else {
                        World["Islands"].push(
                            {
                                ID: World["Islands"]["length"] + 1,
                                Tiles: Utils.CreateWorld([(World["Islands"]["length"] + 1) * 100, (World["Islands"]["length"] + 1) * 100]),
                                Outposts: [{
                                    Location: [((World["Islands"]["length"] + 1) * 100) / 2, ((World["Islands"]["length"] + 1) * 100) / 2],
                                    Default: true
                                }],
                                Shop: {
                                    Items: GameData.Items.filter((Item) => { return Item["BuyingDetails"] }).map((Item) => {
                                        return {
                                            Item: Item["ID"],
                                            Quantity: 0
                                        }
                                    }),
                                    RestockNum: 0,
                                    LastRestockTime: 0
                                }
                            }
                        );
                        World["Inventory"] = NewInventory;

                        await WorldDatabase.Set(Data["User"], World);
                        return await interaction.update(await Utils.BuildHomeScreen(await client["users"].fetch(Data["User"]), interaction.user, World["Islands"]["length"]));
                    }
                }
                else return await interaction.update(await Utils.BuildHomeScreen(await client["users"].fetch(Data["User"]), interaction.user, parseInt(interaction.values[0].split('_')[1])));
            }

            else if (CustomID === "OutpostSelect") return await interaction.update(await Utils.BuildHomeScreen(await client["users"].fetch(Data["User"]), Data["Island"], parseInt(interaction.values[0])));
        }
    }
});