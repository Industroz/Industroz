import { ButtonInteraction } from "discord.js";

import defineEvent from "./../resources/Bot/events.js";
import { ModsDatabase } from "./../databases/Databases.js";
import Mods from "./../mods/Mods.js";

defineEvent(
    {
        Name: 'Mods Button Interaction',
        Event: "interactionCreate",

        Execute: async (Utils, GameData, interaction: ButtonInteraction) => {
            if (interaction.isButton()) {
                const CustomID = interaction.customId.split('$')[0];
                const Data = JSON.parse(interaction.customId.split('$')[1]);

                if (CustomID === "ApplyMod") {
                    const ModNames = Mods.map((Mod) => { return Mod.Configuration.Name; });

                    if (ModNames.includes(Data["Mod"])) {
                        await ModsDatabase.Set(interaction.user.id, Data["Mod"]);

                        await interaction.reply({
                            content: `The Mod ${Data["Mod"]} was applied to the Game Successfully!`,
                            ephemeral: true
                        });
                    }
                    else await interaction.reply({
                        content: `The Mod ${Data["Mod"]} doesn't exist in the Game!`,
                        ephemeral: true
                    });
                }

                else if (CustomID === "Mods") await interaction.reply(await Utils.BuildModsEmbed());
            }
        }
    }
)