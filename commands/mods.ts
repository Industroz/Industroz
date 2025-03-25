import defineCommand from "./../resources/Bot/commands.js";

import { ModsDatabase } from "./../databases/Databases.js";
import { defineComponents } from "./../resources/Bot/components.js";

defineCommand({
    Name: 'mods',
    Description: 'Mods',
    Execute: async (interaction, Utils) => {
        const UserMod = await ModsDatabase.Get(interaction.user.id);

        const Message = await Utils.BuildModEmbed(interaction.user.id, UserMod);
        await interaction.reply({
            content: `**Your Current Mod:** ${UserMod}`,
            embeds: Message.embeds ?? [],
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: "Mods",
                        Label: 'View Available Mods',
                        ButtonStyle: "Primary"
                    }
                )
            ]
        });
    }
});