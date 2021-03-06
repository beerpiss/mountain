import { client } from '../utils/client.js';
import { MountainContext } from '../utils/context.js';
import { BadArgumentError } from '../utils/exceptions.js';

client.on('interactionCreate', async (interaction) => {
  try {
    await client.executeInteraction(interaction);
  } catch (e: any) {
    if (interaction.isApplicationCommand() || interaction.isButton()) {
      const ctx = new MountainContext(interaction);
      await ctx.sendError(e instanceof BadArgumentError ? e.message : `Đã có lỗi xảy ra:\n\`\`\`diff\n- ${JSON.stringify(e, ['message', 'arguments', 'type', 'name', 'stacktrace'], 2)}\`\`\``, '', 5000);
    }
  }
});
