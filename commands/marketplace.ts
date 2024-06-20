import { InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";

import DataBase from "./../resources/Database.js";
import defineCommand from "./../resources/Bot/commands.js";
import { Utils } from "./../resources/Utilities.js";
import { Items } from "./../resources/Data.js";
import { SettingsDatabase } from "./settings.js";

interface Marketplace {
    Offers: {
        User: string,
        Items: {
            Item: { Item: number, Quantity: number },
            Cost: { Item: number, Quantity: number },
            OfferEndTime: number
        }[]
    }[]
};

export const MarketplaceDatabase: DataBase<Marketplace> = new DataBase('Marketplace');
MarketplaceDatabase.Set('Global', { Offers: [{ User: '1150357997491593247', Items: Array<Marketplace["Offers"][0]["Items"][0]>(10).fill({ Item: { Item: 1, Quantity: 1 }, Cost: { Item: 1, Quantity: 1 }, OfferEndTime: Date.now() + (3 * 24 * 60 * 60 * 1000) }) }] }, true);

export async function Marketplace(): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
    const Marketplace = await MarketplaceDatabase.Get('Global');
    const Settings = await SettingsDatabase.GetAll();

    if (Marketplace["Offers"].length === 0) return {
        content: `There are no Offers Available in the Marketplace Currently!`,
        ephemeral: true
    };

    return Utils.BuildListEmbed<Marketplace["Offers"][0]>(
        Marketplace["Offers"],
        (Item) => {
            const OfferItemsString = Item["Items"].map((_Item) => {
                const item = Items.filter((item) => { return item["ID"] === _Item["Item"]["Item"] })[0];
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
            await interaction.update(await Utils.BuildMarketplaceUserEmbed(interaction.values[0]));
        },
        { Title: 'Marketplace', Page: 1 }
    );
}

defineCommand({
    Name: 'marketplace',
    Description: 'Marketplace',
    SubCommands: [
        {
            Name: 'view',
            Description: 'View the Current Marketplace Offers Available',
            Options: [
                {
                    Type: "User",
                    Name: 'user',
                    Description: 'View the Offers from a Particular User'
                }
            ]
        }
    ],
    SubCommandGroups: [
        {
            Name: 'offers',
            Description: 'Manage Your Marketplace Offers',
            SubCommands: [
                {
                    Name: 'manage',
                    Description: 'Manage Your Offers in the Marketplace'
                }
            ]
        }
    ],
    Execute: async (interaction) => {
        switch (interaction.options.getSubcommandGroup(false)) {
            case null:
                switch (interaction.options.getSubcommand(true)) {
                    case 'view':
                        const User = interaction.options.getUser('user');

                        if (User === null) return await interaction.reply(await Marketplace());
                        else return await interaction.reply(await Utils.BuildMarketplaceUserEmbed(User.id));
                }

            case 'offers':
                switch (interaction.options.getSubcommand(true)) {
                    case 'manage':
                        return await interaction.reply(await Utils.BuildMarketplaceManageEmbed(interaction.user.id));
                }
        }
    }
});