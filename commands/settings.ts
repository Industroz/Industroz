import { InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";

import { SettingsDatabase } from "./../databases/Databases.js";

export interface _Settings {
    Visibility: "Public" | "Private" | string,
    DisplayName: string
};
export interface Setting {
    Name: keyof _Settings,
    Description: string,
    Emoji: string,
    Type: "Custom" | "Choice",
    Choices?: string[]
};

export const Settings: Array<Setting> = [
    {
        Name: 'Visibility',
        Description: 'Makes your Industrial World either Visible (Public) or Hidden (Private) to Others',
        Emoji: '👀',
        Type: "Choice",
        Choices: ["Public", "Private"],
    },
    {
        Name: 'DisplayName',
        Description: 'Changes your Industroz Display Name that shows up in Embeds',
        Emoji: '🪪',
        Type: "Custom"
    }
];

defineCommand({
    Name: 'settings',
    Description: 'Manage Your Industrial World Settings',
    Options: [
        {
            Type: "String",
            Name: 'setting',
            Description: 'The Setting You want to View',
            Autocomplete: async (interaction) => {
                const UserSettings = await SettingsDatabase.Get(interaction.user.id);
                return Settings.map((Setting, Index) => { return { Name: `${Setting["Name"]}: ${UserSettings[Setting["Name"]]}`, Value: String(Index) } });
            },
        }
    ],
    Execute: async (interaction, Utils, GameData) => {
        const Setting = parseInt(interaction.options.getString('setting') ?? "");
        const UserSettings = await SettingsDatabase.Get(interaction.user.id);

        if (!Setting) return await interaction.reply(await Utils.BuildSettingsEmbed(UserSettings));
        else {
            if (!Settings[Setting]) return await interaction.reply({
                content: `The Specified Setting ${Setting} is Invalid!`,
                ephemeral: true
            });
            else return await interaction.reply(Utils.BuildSettingEmbed(Settings[Setting]["Name"], UserSettings[Settings[Setting]["Name"]]));
        }
    }
});