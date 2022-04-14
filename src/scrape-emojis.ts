import { existsSync, mkdirSync, writeFile } from 'fs';
import axios from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies
import { HTMLElement, parse } from 'node-html-parser';

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

async function fetchUnicodeWebsite(): Promise<string> {
  return new Promise((resolve, reject) => {
    axios.get(UNICODE_FULL_EMOJI_LIST, {
      responseType: 'stream',
    })
      .then(resp => {
        const length = Number(resp.headers['content-length']);
        const chunks: any[] = [];
        let fetched: number = 0;
        resp.data.on('data', (chunk: any) => {
          fetched += chunk.length;
          process.stdout.write(`Fetching emoji table... ${(fetched / length * 100).toFixed(2)}% of ${(length / 1000000).toFixed(2)}MB\r`);
          chunks.push(Buffer.from(chunk));
        });
        resp.data.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf8'));
        });
        resp.data.on('error', (err: any) => {
          reject(err);
        });
      });
  });
}

async function scrapeEmojis(variant: EmojiVariant): Promise<{ [key: string]: string; }> {
  const resp = await fetchUnicodeWebsite();
  const root: HTMLElement = parse(resp);
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
  writeFile('data/emojis.json', JSON.stringify(emojiTable).replace(/[\u007F-\uFFFF]/g, (chr) => `\\u${('0000' + chr.charCodeAt(0).toString(16)).slice(-4)}`), {}, (err: any) => {
    if (err) { console.log(err); }
  });
})();
