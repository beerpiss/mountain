// eslint-disable-next-line import/no-extraneous-dependencies
import { parse, HTMLElement } from 'node-html-parser';
import axios from 'axios';
import { writeFile, mkdirSync, existsSync } from 'fs';

async function scrapeEmojis(): Promise<void> {
  const resp = await axios.get('https://unicode.org/emoji/charts/full-emoji-list.html');
  if (resp.status !== 200) {
    throw new Error('Could not fetch https://unicode.org/emoji/charts/full-emoji-list.html. Do you have Internet?');
  }
  const root: HTMLElement = parse(String(resp.data));
  let parsedTable: { [key: string]: string; }[] = [];
  const table = root.querySelector('table');
  if (!table) {
    throw new Error('broken code!');
  }
  table.querySelectorAll('tr').forEach(tableRow => {
    const tableCells = tableRow.querySelectorAll('td');
    if (tableCells?.length >= 8) {
      const emoji = tableCells[2].innerHTML;
      // @ts-ignore
      const twemoji = tableCells[7]?.querySelector('img')?.getAttribute('src');
      if (emoji && twemoji) {
        const obj: { [key: string]: string; } = {};
        obj[emoji] = twemoji;
        parsedTable.push(obj);
      }
    }
  });

  if (parsedTable) {
    if (!existsSync('./data')) {
      mkdirSync('./data');
    }
    writeFile('data/emojis.json', JSON.stringify(parsedTable), {}, (err: any) => {
      console.log(err);
    });
  }
}

(async () => {
  await scrapeEmojis();
})();
