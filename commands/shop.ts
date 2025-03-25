import { APIEmbed, time } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";

import { WorldDatabase, SettingsDatabase } from "./../databases/Databases.js";

import { Item } from "../mods/Game.js";

defineCommand({
    Name: 'shop',
    Description: 'Use the In-Game Shop of Industroz',
    Options: [
        {
            Type: "String",
            Name: 'island',
            Description: 'The Island whose Shop You want to View',
            Required: true,
            Autocomplete: async (interaction) => {
                const World = await WorldDatabase.Get(interaction.user.id);

                if (World) return World["Islands"].map((Island) => {
                    return { Name: "Island " + String(Island["ID"]), Value: String(Island["ID"]) }
                });
                else return [{ Name: 'You Don\'t Have Any Industrial World!' }];
            }
        }
    ],
    Execute: async (interaction, Utils, GameData) => {
        const Island = parseInt(interaction.options.getString('island') ?? "");
        if (isNaN(Island)) return await interaction.reply({
            content: `The Specified Island ${Island} is Invalid!`,
            ephemeral: true
        });

        const World = await WorldDatabase.Get(interaction.user.id);
        if (Island > World["Islands"]["length"]) return await interaction.reply({
            content: `You don't have an Island with the ID ${Island}!`,
            ephemeral: true
        });

        const Settings = await SettingsDatabase.Get(interaction.user.id);

        const Shops: [number, number][] = [];
        World["Islands"][Island - 1]["Tiles"].forEach((Tiles, Index1) => {
            Tiles.forEach((Tile, Index2) => {
                if (Tile["Tile"] === 4) Shops.push([Index1, Index2]);
            });
        });
        if (Shops["length"] === 0) return await interaction.reply({
            content: `Your World doesn't Have a Shop!`,
            ephemeral: true
        });

        let Message = ``;
        if (((Date.now() - World["Islands"][Island - 1]["Shop"]["LastRestockTime"]) / (1000 * 60 * 60 * 24)) >= 1) {
            let RestockNum = 0;
            World["Islands"][Island - 1]["Tiles"].forEach((Tiles, Index1) => {
                Tiles.forEach((Tile, Index2) => {
                    if (Tile["Component"]) {
                        if (
                            Tile["Tile"] === 4 &&
                            ((Date.now() - Tile["Component"]["LastSalaryPay"]) / (1000 * 60 * 60 * 24)) < 1
                        ) {
                            RestockNum += Tile["Component"]["Workers"];
                            Message += `Shop at [${Index1},${Index2}] *Restocked*\n`;
                        }
                        else Message += `Shop at [${Index1},${Index2}] *Didn't Restock. Pay Salary to the Workers to Restock the Shop*\n`
                    }
                });
            });

            World["Islands"][Island - 1]["Shop"]["Items"].forEach((ShopItem) => {
                ShopItem["Quantity"] += RestockNum * World["Islands"][Island - 1]["Shop"]["RestockNum"];
            });

            if (RestockNum > 0) World["Islands"][Island - 1]["Shop"]["LastRestockTime"] = Date.now();

            await WorldDatabase.Set(interaction.user.id, World);
        }

        const BuyableItems = GameData.Items.filter((Item) => {
            return World["Islands"][Island - 1]["Shop"]["Items"]
                .map((Item) => { return Item["Item"]; })
                .includes(Item["ID"]);
        });

        const Reply = 
            Utils.BuildListEmbed<Item>(
                BuyableItems,
                (Item) => {
                    return [
                        `${Item["Emoji"]} ${Item["Name"]}`,
                        {
                            Label: Item["Name"],
                            Value: Item["Name"],
                            Description: Item["Description"],
                            Emoji: Item["Emoji"]
                        }
                    ];
                },
                async (interaction) => {
                    await interaction.update(
                        await Utils.BuildShopItemEmbed(
                            interaction.user.id,
                            Island,
                            GameData.Items.filter((Item) => { return Item["Name"] === interaction.values[0] })[0]["ID"]
                        )
                    );
                },
                {
                    Title: `${Settings["DisplayName"]}'s Shop`,
                    Page: 1
                }
            );
        (Reply["embeds"] as APIEmbed[])?.splice(0, 0, {
            title: `Shop Restocks`,
            description: Message["length"] === 0 ? `*No Shop Restocks. Shop would Restock at **${String(time((Math.floor(World["Islands"][Island - 1]["Shop"]["LastRestockTime"] / 1000) + (60 * 60 * 24)), "F"))}***` : Message
        });

        return await interaction.reply(Reply);
    }
});