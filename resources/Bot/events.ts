import { AnySelectMenuInteraction, ButtonInteraction, ClientEvents, ComponentType, InteractionReplyOptions, InteractionUpdateOptions, TextChannel } from "discord.js"
import chalk from "chalk";

import { client } from "./client.js";
import Game from "./../../mods/Game.js";
import { ModsDatabase } from "./../../databases/Databases.js";

interface Event {
    Name: string,
    Event: keyof ClientEvents,
    Execute: (Utils: Game["Resources"]["Utilities"], GameData: Game["Resources"]["Data"], ...args: any[]) => (Promise<any> | any)
};

export const Events: Event[] = [];

async function InteractionUserCheck(Interaction: ButtonInteraction | AnySelectMenuInteraction): Promise<boolean> {
    const Message = Interaction.message;
    const Reference = Interaction.message.reference;

    const UnusableResponse: InteractionReplyOptions & InteractionUpdateOptions = {
        content: `The ${ComponentType[Interaction.componentType]} can't be Used by You!`,
        ephemeral: true
    };
    if (Interaction.isButton() || Interaction.isAnySelectMenu()) {
        if (Reference === null) {
            if (Interaction.user.id !== (Message.interaction?.user.id as string)) {
                await Interaction.reply(UnusableResponse);
                return false;
            }
            else return true;
        }
        else {
            const Guild = await Interaction.client.guilds.fetch(Reference?.guildId as string);
            const Channel = (await Guild.channels.fetch(Reference?.channelId as string)) as TextChannel;
            const RepliedMessage = await Channel.messages.fetch(Reference?.messageId as string);

            if (RepliedMessage.interaction?.user.id === Interaction.user.id) return true;
            else {
                await Interaction.reply(UnusableResponse);
                return false;
            }
        }
    }
    else return true;
}

export default function defineEvent(Event: Event) {
    const ExistingEvent = Events.filter((_Event) => {
            return _Event["Name"] === Event["Name"];
    })[0] === undefined;

    if (ExistingEvent) {
        Events.push(Event);
        console.log(chalk.blueBright(`\tEvent ${chalk.cyanBright(Event["Name"])} Defined!\n`));

        if (client) client.on(Event["Event"], async (...args: any[]) => {
            let Run = true;

            let Mod: Game = (await import('./../../mods/Vanilla.js')).default;

            if (Event["Event"] === "interactionCreate") {
                const interaction = args[0] as (ButtonInteraction | AnySelectMenuInteraction);

                if (!interaction.replied) if (interaction.type === 3) Run = await InteractionUserCheck(interaction);

                if (await ModsDatabase.Get(interaction.user.id)) Mod = (await import(`./../../mods/${await ModsDatabase.Get(interaction.user.id)}.js`)).default;
            }

            if (Run) await Event.Execute(Mod.Resources.Utilities, Mod.Resources.Data, ...args);
        });
    }
}