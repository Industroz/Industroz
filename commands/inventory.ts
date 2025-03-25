import defineCommand from "../resources/Bot/commands.js";

import { WorldDatabase } from "./../databases/Databases.js";

defineCommand({
    Name: 'inventory',
    Description: 'Manage Your Industrial Inventory',
    Options: [
        {
            Type: "String",
            Name: 'item',
            Description: 'The Item You Want to View',
            Autocomplete: async (interaction, Utils, GameData) => {
                const World = await WorldDatabase.Get(interaction.user.id);

                if (World["Inventory"].length === 0) return [{ Name: 'Your Inventory is Empty!' }];
                else return World["Inventory"].map((Item) => {
                    const item = GameData.Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
                    return { Name: `${Utils.Plural(item["Name"])} (×${Item["Quantity"]})`, Value: String(Item["Item"]) }
                });
            }
        }
    ],
    Execute: async (interaction, Utils, GameData) => {
        let Item = parseInt(interaction["options"].getString('item') ?? '');
        const World = await WorldDatabase.Get(interaction.user.id);

        if (!World) return await interaction.reply({
            content: 'You don\'t have an Industrial World yet!',
            ephemeral: true
        });

        if (!Item) {
            if (World["Inventory"]["length"] === 0) return await interaction.reply({
                content:`Your Inventory is Empty!`,
                ephemeral: true
            });
            else return await interaction.reply(await Utils.BuildInventoryEmbed(interaction, World["Inventory"]));
        }
        else {
            const _Item = GameData.Items.filter((_Item) => { return _Item["ID"] === Item })[0];

            if (_Item === undefined) return await interaction.reply({
                content: `The Specified Item ${Item} is Invalid!`,
                ephemeral: true
            });
            else return await interaction.reply(await Utils.BuildInventoryItemEmbed(
                interaction.user.id,
                Item,
                World["Inventory"].filter((InvItem) => { return InvItem["Item"] === Item })[0]["Quantity"]
            ));
        }
    }
});