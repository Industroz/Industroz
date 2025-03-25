import { ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from "discord.js";

import defineEvent from "./../resources/Bot/events.js";
import { defineModal, defineComponents } from "./../resources/Bot/components.js";

import { Settings, Setting } from "../commands/settings.js";
import { SettingsDatabase } from "./../databases/Databases.js";

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings Button Interaction',
    
    Execute: async (Utils, GameData, interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'Settings') {
                const Settings = await SettingsDatabase.Get(interaction.user.id);
                await interaction.update(await Utils.BuildSettingsEmbed(Settings));
            }

            else if (CustomID === 'UpdateSettingCustom') {
                await interaction.showModal(
                    defineModal({
                        Title: 'Edit Setting',
                        CustomID: 'EditSettingCustom',
                        Components: defineComponents(
                            {
                                ComponentType: "TextInput",
                                CustomID: 'SettingValue',
                                Placeholder: 'Enter new Setting Value...',
                                Label: `Change ${Data["Setting"]} to:`,
                                Required: true,
                                TextStyle: "Short",
                            }
                        ),
                        Data: Data
                    })
                );
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings SelectMenu Interaction',
    
    Execute: async (Utils, GameData, interaction: StringSelectMenuInteraction) => {
        if (interaction.isStringSelectMenu()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'UpdateSettingChoice') {
                const UserSettings = await SettingsDatabase.Get(interaction.user.id);
                const Setting = Settings.filter((Setting) => { return Setting["Name"] === Data["Setting"] })[0];

                UserSettings[Setting["Name"]] = (Setting["Choices"] as string[])[Number(interaction.values[0])];

                await SettingsDatabase.Set(interaction.user.id, UserSettings);
                await interaction.reply({
                    content: `The ${Setting["Name"]} Setting was Succesfully Changed to ${UserSettings[Setting["Name"]]}!`,
                    ephemeral: true
                });
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings ModalSubmit Interaction',
    
    Execute: async (Utils, GameData, interaction: ModalSubmitInteraction) => {
        if (interaction.isModalSubmit()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'EditSettingCustom') {
                const Settings = await SettingsDatabase.Get(interaction.user.id);
                
                Settings[(Data["Setting"] as Setting["Name"])] = interaction.fields.getTextInputValue('SettingValue${}');
                await SettingsDatabase.Set(interaction.user.id, Settings);
                await interaction.reply({
                    content: `${Data["Setting"]} Setting was Successfully Changed to ${interaction.fields.getTextInputValue('SettingValue${}')}`,
                    ephemeral: true
                });
            }
        }
    }
});