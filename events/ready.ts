import defineEvent from "../resources/Bot/events.js";

import { MarketplaceDatabase } from "./../databases/Databases.js";

defineEvent(
    {
        Event: "ready",
        Name: 'Client Ready',
        Execute: async () => {
            await MarketplaceDatabase.Set('Global', { Offers: [] }, false);
        }
    }
);