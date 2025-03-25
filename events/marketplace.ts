import { ButtonInteraction, ModalMessageModalSubmitInteraction, ModalSubmitInteraction, User } from "discord.js";
import { stripIndent } from "common-tags";

import defineEvent from "./../resources/Bot/events.js";
import { defineComponents, defineModal } from "./../resources/Bot/components.js";

import { World } from "../commands/world.js";
import { Item } from "./../mods/Game.js";
import { WorldDatabase, MarketplaceDatabase, SettingsDatabase } from "./../databases/Databases.js";

defineEvent(
    {
        Event: "interactionCreate",
        Name: 'Marketplace Button Interaction',
        
        Execute: async (Utils, GameData, interaction: ButtonInteraction) => {
            if (interaction.isButton()) {
                const CustomID = interaction.customId.split('$')[0];
                const Data = JSON.parse(interaction.customId.split('$')[1]);

                if (CustomID === 'Marketplace') await interaction.update(await Utils.BuildMarketplaceEmbed());
                else if (CustomID === 'MarketplaceUser') await interaction.update(await Utils.BuildMarketplaceUserEmbed(Data["User"]));

                else if (CustomID === 'BuyOffer') {
                    const Marketplace = await MarketplaceDatabase.Get('Global');
                    const Settings = await SettingsDatabase.GetAll();
                    const Offer = Marketplace["Offers"].filter((Offer) => { return Offer["User"] === Data["User"] })[0]["Items"][Data["Offer"]];

                    const SellerWorld = await WorldDatabase.Get(Data["User"]);
                    const BuyerWorld = await WorldDatabase.Get(interaction.user.id);

                    const [NewInventory, Message] = Utils.Pay(BuyerWorld["Inventory"], [Offer["Cost"]]);
                    if (Message !== '') return await interaction.reply({ content: Message, ephemeral: true });

                    BuyerWorld["Inventory"] = Utils.EditInventory(NewInventory, Offer["Item"]["Item"], "Add", Offer["Item"]["Quantity"]);;
                    await WorldDatabase.Set(interaction.user.id, BuyerWorld);

                    SellerWorld["Inventory"] = Utils.EditInventory(SellerWorld["Inventory"], Offer["Cost"]["Item"], "Add", Offer["Cost"]["Quantity"]);
                    SellerWorld["Inventory"] = Utils.EditInventory(SellerWorld["Inventory"], Offer["Item"]["Item"], "Remove", Offer["Item"]["Quantity"]);
                    await WorldDatabase.Set(Data["User"], SellerWorld);

                    Marketplace["Offers"].forEach((UserOffer, Index) => {
                        if (UserOffer["User"] === Data["User"]) {
                            UserOffer["Items"].splice(Data["Offer"], 1);
                            
                            if (UserOffer["Items"].length === 0) Marketplace["Offers"].splice(Index, 1)
                        }
                    });
                    await MarketplaceDatabase.Set('Global', Marketplace);

                    return await interaction.reply({
                        content: `You have Successfully Bought the Offer of ${Settings[Data["User"]]["DisplayName"]}!`,
                        ephemeral: true
                    });
                }

                else if (CustomID === 'OfferAdd') {
                    if (Object.entries(Data).length > 0) {
                        const Marketplace = await MarketplaceDatabase.Get('Global');
                        let UserOffer = Marketplace["Offers"].filter((User) => { return User["User"] === interaction.user.id; })[0];

                        if (!UserOffer) {
                            Marketplace["Offers"].push({ User: interaction.user.id, Items: [] })
                            UserOffer = { User: interaction.user.id, Items: [] };
                        }

                        UserOffer["Items"].push({
                            Item: {
                                Item: Data["Sell"][0] as number,
                                Quantity: Data["Sell"][1] as number
                            },
                            Cost: {
                                Item: Data["Get"][0] as number,
                                Quantity: Data["Get"][1] as number
                            }
                        });

                        await MarketplaceDatabase.Set('Global', Marketplace);

                        const SellItem: { Item: Item, Quantity: number } = {
                            Item: GameData.Items.filter((Item) => { return Item["ID"] === Data["Sell"][0]; })[0],
                            Quantity: Data["Sell"][1]
                        };
                        const GetItem: { Item: Item, Quantity: number } = {
                            Item: GameData.Items.filter((Item) => { return Item["ID"] === Data["Get"][0]; })[0],
                            Quantity: Data["Get"][1]
                        };
                        return await interaction.update({
                            content: stripIndent`
                            **New Offer Successfully Added!**
                            > ${GetItem["Item"]["Emoji"]} ${GetItem["Item"]["Name"]} ×${GetItem["Quantity"]} → ${SellItem["Item"]["Emoji"]} ${SellItem["Item"]["Name"]} ×${SellItem["Quantity"]}
                            `,
                            components: []
                        });
                    }
                    else {
                        const Marketplace = await MarketplaceDatabase.Get('Global')
                        const World = await WorldDatabase.Get(interaction.user.id);

                        const OfferNum = (Marketplace["Offers"].filter((Offer) => { return Offer["User"] === interaction.user.id; })[0] ?? { Items: [] })["Items"]["length"]

                        if (OfferNum >= World["MaxMarketplaceNum"]) {
                            return await interaction.reply({
                                content: `You can't Create New Marketplace Offers due to Inavailability of Space!`,
                                ephemeral: true
                            });
                        }

                        const FilteredItems = World["Inventory"].filter((InvItem) => {
                            const Item = GameData.Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                            return Item["SellDetails"];
                        });
                        await interaction.reply({
                            content: '**Item To Sell: **',
                            components: Utils.BuildListEmbed<World["Inventory"][0]>(
                                FilteredItems,
                                (InvItem) => {
                                    const Item = GameData.Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                                    return [
                                        '',
                                        { Label: Item["Name"], Emoji: Item["Emoji"], Description: Item["Description"], Value: JSON.stringify({ Item: Item["ID"], Quantity: InvItem["Quantity"] }) }
                                    ];
                                },
                                async (interaction) => {
                                    const SellItem: { Item: Item, Quantity: number } = {
                                        Item: GameData.Items.filter((Item) => { return Item["ID"] === JSON.parse(interaction.values[0])["Item"]; })[0],
                                        Quantity: JSON.parse(interaction.values[0])["Quantity"]
                                    };

                                    await interaction.showModal(
                                        defineModal({
                                            Title: `Quantity of ${SellItem["Item"]["Name"]} to Sell`,
                                            CustomID: 'MarketplaceSellItem',
                                            Components: defineComponents(
                                                {
                                                    ComponentType: "TextInput",
                                                    CustomID: 'SellItemQuantity',
                                                    Label: `Quantity of ${SellItem["Item"]["Name"]} to Sell`,
                                                    Placeholder: `How many ${SellItem["Item"]["Name"]} You Want to Sell?`,
                                                    Required: true,
                                                    TextStyle: "Short"
                                                }
                                            ),
                                            Data: { Item: SellItem["Item"]["ID"], Quantity: SellItem["Quantity"] }
                                        })
                                    );
                                },
                                { Embed: false, Title: 'AAAA', Page: 1 }
                            )["components"],
                            ephemeral: true
                        });
                    }
                }

                else if (CustomID === 'DeleteOffer') {
                    const Marketplace = await MarketplaceDatabase.Get('Global');
                    const UserOffers = Marketplace["Offers"].filter((Offer) => { return Offer["User"] === interaction.user.id })[0];

                    if (!UserOffers) return await interaction.reply({
                        content: `The Specified User doesn't have any Marketplace Offers!`,
                        ephemeral: true
                    });

                    UserOffers["Items"].splice(Data["Offer"], 1);
                    if (UserOffers["Items"].length === 0) Marketplace["Offers"].splice(Marketplace["Offers"].indexOf(UserOffers), 1);

                    await MarketplaceDatabase.Set('Global', Marketplace);
                    await interaction.reply({
                        content: `Offer Number ${Data["Offer"]} was Deleted Successfully!`,
                        ephemeral: true
                    });
                }
            }
        }
    }
);

defineEvent({
    Event: "interactionCreate",
    Name: 'Marketplace Modal Submit',

    Execute: async (Utils, GameData, interaction: ModalMessageModalSubmitInteraction) => {
        if (interaction.isModalSubmit()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'MarketplaceSellItem') {
                const Quantity = parseInt(interaction.fields.getTextInputValue('SellItemQuantity${}'));

                if (isNaN(Quantity)) return interaction.reply({
                    content: `${interaction.fields.getTextInputValue('SellItemQuantity${}')} isn't a Valid Integral Quantity!`,
                    ephemeral: true
                });

                const SellItem: { Item: Item, Quantity: number } = {
                    Item: GameData.Items.filter((Item) => { return Item["ID"] === Data["Item"]; })[0],
                    Quantity: Quantity > Data["Quantity"] ? Data["Quantity"] : Quantity
                };

                await interaction.update({
                    content:
                        stripIndent`
                        > **Sell: **
                        > Item: ${SellItem["Item"]["Emoji"]} ${SellItem["Item"]["Name"]}
                        > Quantity: ×${SellItem["Quantity"]}\n
                        **Item to Get: **`,
                    components: Utils.BuildListEmbed<Item>(
                        GameData.Items.filter((Item) => { return Item["ID"] !== SellItem["Item"]["ID"] }),
                        (Item) => {
                            return [
                                '',
                                { Label: Item["Name"], Emoji: Item["Emoji"], Description: Item["Description"], Value: `${Item["ID"]}` }
                            ];
                        },
                        async (interaction) => {
                            const GetItem = GameData.Items.filter((Item) => { return Item["ID"] === JSON.parse(interaction.values[0]); })[0];

                            await interaction.showModal(
                                defineModal({
                                    Title: `Quantity of ${GetItem["Name"]} to Get`,
                                    CustomID: 'MarketplaceGetItem',
                                    Components: defineComponents(
                                        {
                                            ComponentType: "TextInput",
                                            CustomID: 'GetItemQuantity',
                                            Label: `Quantity of ${GetItem["Name"]} to Get`,
                                            Placeholder: `How many ${GetItem["Name"]} You Want to Get?`,
                                            Required: true,
                                            TextStyle: "Short"
                                        }
                                    ),
                                    Data: { Sell: { Item: SellItem["Item"]["ID"], Quantity: SellItem["Quantity"] }, Get: GetItem["ID"] }
                                })
                            );
                        },
                        { Embed: false, Title: 'BBBB', Page: 1 }
                    )["components"]
                });
            }
            else if (CustomID === 'MarketplaceGetItem') {
                const Quantity = parseInt(interaction.fields.getTextInputValue('GetItemQuantity${}'));

                if (isNaN(Quantity)) return interaction.reply({
                    content: `${interaction.fields.getTextInputValue('GetItemQuantity${}')} isn't a Valid Integral Quantity!`,
                    ephemeral: true
                });

                const SellItem: { Item: Item, Quantity: number } = {
                    Item: GameData.Items.filter((Item) => { return Item["ID"] === Data["Sell"]["Item"]; })[0],
                    Quantity: Data["Sell"]["Quantity"]
                };
                const GetItem: { Item: Item, Quantity: number } = {
                    Item: GameData.Items.filter((Item) => { return Item["ID"] === Data["Get"]; })[0],
                    Quantity: Quantity
                };

                await interaction.update({
                    content:
                        stripIndent`
                        > **Sell: **
                        > Item: ${SellItem["Item"]["Emoji"]} ${SellItem["Item"]["Name"]}
                        > Quantity: ×${SellItem["Quantity"]}
                        > **Get: **
                        > Item: ${GetItem["Item"]["Emoji"]} ${GetItem["Item"]["Name"]}
                        > Quantity: ×${GetItem["Quantity"]}`,
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'OfferAdd',
                                Label: 'Add Offer',
                                ButtonStyle: "Success",
                                Data: { Sell: [ SellItem["Item"]["ID"], SellItem["Quantity"] ], Get: [ GetItem["Item"]["ID"], GetItem["Quantity"] ] }
                            }
                        )
                    ]
                });
            }
        }
    }
});