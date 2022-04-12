import { AutocompleteInteraction } from 'discord.js';
import { TagService } from '../data/services/tag-service.js';

export async function tagAutocompleter(interaction: AutocompleteInteraction) {
  const tagNames = await TagService.getAllTagNames();
  const tagNameObject = tagNames.map(name => {
    return { name: name, value: name };
  });
  interaction.respond(tagNameObject);
}
