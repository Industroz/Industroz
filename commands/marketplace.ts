import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";
import { defineComponents } from "../resources/Bot/components.js";

import { MarketplaceDatabase, SettingsDatabase } from "./../databases/Databases.js";

export interface Marketplace {
    Offers: {
        User: string,
        Items: {
            Item: { Item: number, Quantity: number },
            Cost: { Item: number, Quantity: number }
        }[]
    }[]
};

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
        },
        {
            Name: 'manage',
            Description: 'Manage Your Marketplace Offers',
        }
    ],
    Execute: async (interaction, Utils, GameData) => {
        if (interaction.options.getSubcommand(true) === 'view') {
            const User = interaction.options.getUser('user');

            if (User === null) return await interaction.reply(await Utils.BuildMarketplaceEmbed());
            else return await interaction.reply(await Utils.BuildMarketplaceUserEmbed(User.id));
        }
        else if (interaction.options.getSubcommand(true) === 'manage') {
            const Marketplace = await MarketplaceDatabase.Get('Global');
            const Settings = await SettingsDatabase.GetAll();

            let UserOffers = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === interaction.user.id; })[0];
            if (UserOffers === undefined) UserOffers = { User: interaction.user.id, Items: [] };

            const Reply = Utils.BuildListEmbed<typeof UserOffers["Items"][0]>(
                UserOffers["Items"],
                (Item, Index) => {
                    const OfferItem = GameData.Items.filter((OfferItem) => { return OfferItem["ID"] === Item["Item"]["Item"]; })[0];
                    const BuyItem = GameData.Items.filter((BuyItem) => { return BuyItem["ID"] === Item["Cost"]["Item"]; })[0];

                    const ItemCostString = {
                        Emoji: `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`,
                        NoEmoji: `${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`
                    };
                    return [
                        `${(Index as number) + 1}. ${ItemCostString["Emoji"]}`,
                        { Label: ItemCostString["NoEmoji"], Value: (Index as number).toString(), Emoji: OfferItem["Emoji"] }
                    ];
                },
                async (interaction) => {
                    const UserOffer = UserOffers.Items[parseInt(interaction.values[0])];

                    const OfferItem = GameData.Items.filter((Item) => { return Item["ID"] === UserOffer["Item"]["Item"]; })[0];
                    const BuyItem = GameData.Items.filter((Item) => { return Item["ID"] === UserOffer["Cost"]["Item"]; })[0];

                    await interaction.reply({
                        embeds: [
                            {
                                title: `Offer ${parseInt(interaction.values[0]) + 1}`,
                                fields: [
                                    { name: 'You Give:', value: `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${UserOffer["Cost"]["Quantity"]}`, inline: true },
                                    { name: 'Your Receive:', value: `${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${UserOffer["Item"]["Quantity"]}`, inline: true }
                                ]
                            }
                        ],
                        components: [
                            defineComponents(
                                {
                                    ComponentType: "Button",
                                    CustomID: 'DeleteOffer',
                                    Label: 'Delete Offer',
                                    ButtonStyle: 'Danger',
                                    Data: { Offer: parseInt(interaction.values[0]) }
                                }
                            )
                        ],
                        ephemeral: true
                    })
                },
                { SelectMenu: UserOffers["Items"]["length"] !== 0, Title: Settings[interaction.user.id]["DisplayName"], Page: 1 }
            );

            if (UserOffers["Items"].length === 0) (Reply["embeds"] as APIEmbed[])[0]["description"] = `You do not have any Offers Available in the Marketplace!`;

            (Reply["components"] as APIActionRowComponent<APIMessageActionRowComponent>[]).splice(
                0, 0,
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'OfferAdd',
                        Label: 'Add New Offer',
                        ButtonStyle: "Success"
                    }
                )
            );

            await interaction.reply(Reply);
        }
    }
});