const needle = require('needle'),
  cheerio = require('cheerio'),
  fs = require('file-system'),
  Nightmare = require('nightmare'),
  nightmare = Nightmare({ show: true }),
  fanficsArr = require('./fanfics'),
  newFanficsArr = [];


//  Создать задержку
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Вывести в консоль кол-во фанфиков в fanfics.json
console.log(`Всего фэндомов: ${fanficsArr.length}\n`);

// Начать подсчет времени выполнения парсинга 
console.time("Конец работы");

(async () => {
  let cookies = [];

  // Получить cookies с сайта
  async function getCookies(login, password) {
    const cookiesObj = {};

    await nightmare
      .goto('https://ficbook.net/')
      .click('#jsLogin span')
      .wait('.login-dropdown')
      .type('form [name=login]', login)
      .type('form [name=password]', password)
      .click('form [name=do_login]')
      .wait('.header-info')
      .cookies.get()
      .end()
      .then(cookies => {
        cookies.forEach(item => {
          const key = item.name;
          const value = item.value;
          cookiesObj[key] = value;
        })
      })
      .catch(function (error) {
        console.error('Authorization failed:', error);
      });
    return cookiesObj;
  }


  // Получить данные с сайта   
  async function scrape(fanficContext, link) {
    // проверить, к какому типу относится ссылка
    const linkFilter = link.includes('fandom_filter');
    // дополнить ссылку со страницы фильтра необходимыми параметрами
    let urlOuter;
    linkFilter && (urlOuter = `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!#result`);

    let options = {
      follow_max: 10,
      follow_set_cookies: true,
      follow_set_referer: true,
      follow_keep_method: true,
      follow_if_same_host: true,
      follow_if_same_protocol: true,
      follow_if_same_location: true,
      compressed: true,
      cookies: cookies,
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
    }

    await needle('get', linkFilter ? urlOuter : `${link}?p=1`, options)
      .then(async function (res, err) {
        if (err) throw err;

        // вычислить количество страниц на странице фэндома
        let $ = cheerio.load(res.body),
          page = $("#no-cookie-warning p").html();

        console.log(page);

        page = $(".pagenav .paging-description b:last-of-type").html();
        page = page ? page : 1;
        // дополнить ссылку со страницы фильтра необходимыми параметрами
        let urlInner;
        linkFilter && (urlInner = `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!&p=${page}#result`);

        await needle('get', linkFilter ? urlInner : `${link}?p=${page}`, options)
          .then(async function (res, err) {
            if (err) throw err;
            $ = cheerio.load(res.body);
            // проверить наличие блока с "горячими работами"
            const blockSeparator = $(".fanfic-thumb-block").next($(".block-separator")).length;
            // вычислить количество фанфиков на последней странице
            let articles;
            if (linkFilter && blockSeparator) {
              articles = $(".fanfic-thumb-block").next($(".block-separator")).nextAll($(".fanfic-thumb-block")).length;
            } else if (linkFilter) {
              articles = $(".fanfic-thumb-block").length;
            } else {
              articles = $(".fanfic-thumb-block:last-of-type .fanfic-inline").length;
            }
            // вычислить количество фанфиков на всех страницах
            if (page != 1) {
              articles = (page - 1) * 20 + articles;
            }
            await fanficContext.setArticleCount(articles); // установить значение в свойство articleCount
            await fanficContext.checkIsNew(); // проверить разницу между oldArticleCount и articleCount 
            await fanficContext.putData(); // добавить новые данные в массив newFanficsArr 
          })
          .catch(function (err) {
            console.log(`Needle inner error!\n ${err}\n`)
          });
      })
      .catch(function (err) {
        console.log(`Needle outer error!\n ${err}\n`)
      });
  } // end function scrape

  // Рабочий объект  
  const fanficProto = {
    name: '',
    url: '',
    oldArticleCount: 0,
    articleCount: 0,
    async loadArticleCount() {
      await scrape(this, this.url);
    },
    setArticleCount(count) {
      // добавить в объект новое количество фанфиков
      this.articleCount = count;
    },
    hasNew() {
      // сравнить новое и старое количество фанфиков
      return this.articleCount - this.oldArticleCount;
    },
    checkIsNew() {
      const difference = this.hasNew();
      // проверить, к какому типу относится ссылка
      const linkFilter = this.url.includes('fandom_filter');
      // вывести после сравнения количество добавленных фанфиков  
      if (difference > 0 && linkFilter) {
        console.log(`${this.name}\nновых ${difference}\n${this.url}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!#result\n`);
      } else if (difference > 0) {
        console.log(`${this.name}\nновых ${difference}\n${this.url}\n`);
      } else if (difference < 0) {
        console.log(`${this.name}\nудалено ${difference}\n`);
      }
    },
    async putData() {
      // cоздать объект с новыми данными и добавить их в массив newFanficsArr
      const newFanficsObject = {
        "name": this.name,
        "url": this.url,
        "count": this.articleCount
      };
      newFanficsArr.push(newFanficsObject);
    }
  } // end fanficProto 

  //Создать массив с данными из fanfics.json 
  async function readCollection() {
    // создать пустой массив
    const fanficsArrCopy = [];

    // создать объекты с использованием данных из fanfics.json и добавить их в массив fanficsArrCopy
    for (let i = 0; i < 1; i++) {
      const fanficObj = Object.assign({}, fanficProto);
      fanficObj.name = fanficsArr[i].name;
      fanficObj.url = fanficsArr[i].url;
      fanficObj.oldArticleCount = fanficsArr[i].count;
      fanficsArrCopy.push(fanficObj);
    }

    // вызвать функцию loadArticleCount для каждого объекта из созданного массива      
    for (const fanficsItem of fanficsArrCopy) {
      await fanficsItem.loadArticleCount();
      await timeout(500); // задержка
    }
  } // end function readCollection  


  cookies = await getCookies('guzeeva', 'L0232bd533b5591b14c4GH'); // вызвать функцию getCookies и установить cookies 
  // console.log(cookies);
  await readCollection(); // вызвать функцию readCollection 


  if (fanficsArr.length == newFanficsArr.length) {
    await fs.writeFileSync('./fanfics.json', JSON.stringify(newFanficsArr, null, 2)); // записать новые данные в fanfics.json
  }
  else {
    console.log("Ошибка. Данные не могут быть сохранены");
  }
  console.timeEnd("Конец работы"); // завершить подсчет времени выполнения парсинга 
})();
