const cheerio = require('cheerio');
const request = require('./request');

const jar = request.jar();

class ComBui {
  constructor() {
    this.request = request.defaults({
      jar,
      followRedirect: false,
      followAllRedirects: false,
      gzip: true,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3765.0 Safari/537.36'
      }
    });
  }

  async getMenu() {
    const { body } = await this.request({
      url: 'https://www.combui.online/',
      method: 'GET'
    });

    const $ = cheerio.load(body);

    const days = [];

    $('#SECTION26 .ladi-group > div[id*="HEADLINE"]')
      .toArray()
      .forEach(item => {
        const $item = $(item);
        const text = $item.text();
        if (
          text &&
          text
            .trim()
            .toLowerCase()
            .indexOf('thứ') === 0
        ) {
          days.push($item.parent());
        }
      });

    const menu = [];

    days.forEach(day => {
      const $day = $(day);
      const head = $day
        .find('div[id*="HEADLINE"]')
        .text()
        .trim();
      const content = $day
        .find('div[id*="PARAGRAPH"]')
        .text()
        .trim()
        .replace(/[\n\r]/g, '');
      const id = head.match(/\d/)[0];
      menu.push({
        id: parseInt(id, 10),
        head,
        foods: content
          .split('|')
          .map(i => i.trim())
          .filter(i => i)
      });
    });

    return menu;
  }
}

const getMenu = async dayOfWeek => {
  const comBui = new ComBui();
  const menu = await comBui.getMenu();
  return menu.find(i => i.id === parseInt(dayOfWeek, 10));
};

module.exports = {
  getMenu
};
