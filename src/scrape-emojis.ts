// eslint-disable-next-line import/no-extraneous-dependencies
import { parse, HTMLElement } from 'node-html-parser';
import { existsSync, mkdirSync, writeFile } from 'fs';
import axios from 'axios';

const EMOJI_CHARACTER_CELL_INDEX: number = 2;
const UNICODE_FULL_EMOJI_LIST: string = 'https://unicode.org/emoji/charts/full-emoji-list.html';

enum EmojiVariant {
  APPLE = 3,
  GOOGLE = 4,
  FACEBOOK = 5,
  WINDOWS = 6,
  TWEMOJI = 7,
  JOYPIXELS = 8,
  SAMSUNG = 9,
  GMAIL = 10,
  SOFTBANK = 11,
  DOCOMO = 12,
  KDDI = 13,
}

async function parseTableRow(tableRow: HTMLElement, variant: EmojiVariant): Promise<{ [key: string]: string; } | null> {
  const tableCells = tableRow.querySelectorAll('td');
  if (tableCells?.length < variant + 1) {  // Does it have a cell for the variant we want?
    return null; 
  }
  if (tableCells[variant].innerHTML === '—') { // Is the cell populated with an emoji, or a placeholder?
    return null;
  }
  const emoji = tableCells[EMOJI_CHARACTER_CELL_INDEX].innerHTML;
  const twemoji = tableCells[variant]?.querySelector('img')?.getAttribute('src');
  if (emoji && twemoji) {
    const obj: { [key: string]: string; } = {};
    obj[emoji] = twemoji;
    return obj;
  } else {
    return null;
  }
}

async function scrapeEmojis(variant: EmojiVariant): Promise<{ [key: string]: string; }> {
  const resp = await axios.get(UNICODE_FULL_EMOJI_LIST, {
    onDownloadProgress: (progressEvent) => {
      process.stdout.write(`Fetching website: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)} of ${progressEvent.lengthComputable}\r`);
    },
  });
  console.log('');
  if (resp.status !== 200) {
    throw new Error(`Could not fetch ${UNICODE_FULL_EMOJI_LIST}. Do you have Internet?`);
  }
  const root: HTMLElement = parse(resp.data);
  const table = root.querySelector('table');
  if (!table) {
    throw new Error('broken code!');
  }
  const parsedTable = <{ [key: string]: string; }[]>(await Promise.all(table.querySelectorAll('tr').map(tableRow => parseTableRow(tableRow, variant)))).filter(value => value !== null);
  return parsedTable.reduce((prev, curr) => {
    return Object.assign(prev, curr);
  });
}

(async () => {
  const emojiTable = await scrapeEmojis(EmojiVariant.TWEMOJI);
  if (!existsSync('./data')) {
    mkdirSync('./data');
  }
  writeFile('data/emojis.json', JSON.stringify(emojiTable), {}, (err: any) => {
    if (err) { console.log(err); }
  });
})();
