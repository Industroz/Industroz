import { defineComponents } from "../resources/Bot/components.js";
import defineCommand from "../resources/Bot/commands.js";

import Mods from "./../mods/Mods.js";
import { WorldDatabase } from "./../databases/Databases.js";

export interface World {
    Islands: {
        ID: number,
        Tiles: {
            Tile: number,
            Component?: {
                Level: number,
                Production: number[],
                Workers: number,
                LastSalaryPay: number,
                Hoarding: { Item: number, Quantity: number }[]
            }
        }[][],
        Outposts: {
            Location: [number, number],
            Default: boolean
        }[],
        Shop: {
            Items: { Item: number, Quantity: number }[],
            RestockNum: number,
            LastRestockTime: number
        }
    }[],
    Inventory: {
        Item: number,
        Quantity: number
    }[],
    LastOnlineTime: number,
    MaxMarketplaceNum: number
};

defineCommand({
    Name: 'world',
    Description: 'Manage Your Industrial World',
    SubCommands: [
        {
            Name: 'view',
            Description: 'View Your or the Specified User\'s Industrial World',
            Options: [
                {
                    Type: "Integer",
                    Name: 'island',
                    Description: 'The Island which is to be Viewed',
                    Autocomplete: async (interaction) => {
                        const World = await WorldDatabase.Get(interaction.user.id);
                        
                        if (World) return World["Islands"].map((Island) => {
                            return { Name: "Island " + String(Island["ID"]), Value: String(Island["ID"]) }
                        });
                        else return [{ Name: 'You Don\'t Have Any Industrial World!' }];
                    }
                },
                {
                    Type: "User",
                    Name: 'user',
                    Description: 'The User whose World is to be Viewed'
                }
            ]
        },
        {
            Name: 'create',
            Description: 'Create a New Industrial World or Reset Your Current World',
            Options: [
                {
                    Type: "String",
                    Name: 'visibility',
                    Description: 'Make Your Industrial World Public or Private',
                    Choices: [
                        'Public',
                        'Private'
                    ],
                    Required: true
                },
                {
                    Type: "String",
                    Name: 'mod',
                    Description: 'Select the Mod for your Industrial World',
                    Autocomplete: async (interaction) => {
                        return Mods.map((Mod) => { return { Name: Mod.Configuration.Name, Value: Mod.Configuration.Name } })
                    },
                    Required: true
                }
            ]
        }
    ],
    Execute: async (interaction, Utils, GameData) => {
        switch (interaction.options.getSubcommand(true)) {
            case 'create':
                return await interaction.reply({
                    content: (await WorldDatabase.Get(interaction.user.id)) === undefined ?
                        'Are You sure Creating a New Industrial World?' : 'Are You sure Resetting Your Current Industrial World?',
                    ephemeral: interaction.options.getString('visibility', true) === 'Private',
                    components: [
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'WorldCreateCancel',
                                Label: 'Cancel',
                                ButtonStyle: "Danger"
                            },
                            {
                                ComponentType: "Button",
                                CustomID: `WorldCreateConfirm`,
                                Label: 'Confirm',
                                ButtonStyle: "Primary",
                                Data: {
                                    WorldExists: WorldDatabase.Get(interaction.user.id) !== undefined,
                                    Visibility: interaction.options.getString('visibility'),
                                    Mod: interaction.options.getString('mod')
                                }
                            }
                        )
                    ]
                });
            case "view":
                const Island = interaction.options.getInteger('island') ?? 1;
                const User = interaction.options.getUser('user') ?? interaction.user;

                return await interaction.reply(await Utils.BuildHomeScreen(User, interaction.user, Island))
        }
    }
});