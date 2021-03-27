const needle = require('needle'),
  cheerio = require('cheerio'),
  fs = require('file-system'),
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
  // Получить данные с сайта   
  async function scrape(fanficContext, link) {
    // проверить, к какому типу относится ссылка
    const linkFilter = link.includes('fandom_filter');
    // дополнить ссылку со страницы фильтра необходимыми параметрами
    let urlOuter;
    linkFilter && (urlOuter = `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!#result`);

    await needle('get', linkFilter ? urlOuter : `${link}?p=1`)
      .then(async function (res, err) {
        if (err) throw err;
        // вычислить количество страниц на странице фэндома
        let $ = cheerio.load(res.body),
          page = $(".pagenav .paging-description b:last-of-type").html();
        page = page ? page : 1;
        // дополнить ссылку со страницы фильтра необходимыми параметрами
        let urlInner;
        linkFilter && (urlInner = `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!&p=${page}#result`);

        await needle('get', linkFilter ? urlInner : `${link}?p=${page}`)
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
            console.log('Needle inner error!')
          });
      })
      .catch(function (err) {
        console.log('Needle outer error!')
      });
  } // end function scrape

  // Рабочий объект  
  const fanficProto = {
    name: '',
    url: '',
    oldArticleCount: 0,
    articleCount: 0,
    loadArticleCount: async function () {
      await scrape(this, this.url);
    },
    setArticleCount: function (count) {
      // добавить в объект новое количество фанфиков
      this.articleCount = count;
    },
    hasNew: function () {
      // сравнить новое и старое количество фанфиков
      return this.articleCount - this.oldArticleCount;
    },
    checkIsNew: function () {
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
    putData: async function () {
      // cоздать объект с новыми данными и добавить их в массив newFanficsArr
      const newFanficsObject = new Object({
        "name": this.name,
        "url": this.url,
        "count": this.articleCount
      });
      newFanficsArr.push(newFanficsObject);
    }
  } // end fanficProto 

  //Создать массив с данными из fanfics.json 
  async function readCollection() {
    // создать пустой массив
    const fanficsArrCopy = [];

    // создать объекты с использованием данных из fanfics.json и добавить их в массив fanficsArrCopy
    for (const fanficsItem of fanficsArr) {
      const fanficObj = Object.assign({}, fanficProto);
      fanficObj.name = fanficsItem.name;
      fanficObj.url = fanficsItem.url;
      fanficObj.oldArticleCount = fanficsItem.count;
      fanficsArrCopy.push(fanficObj);
    }

    // вызвать функцию loadArticleCount для каждого объекта из созданного массива      
    for (const fanficsItem of fanficsArrCopy) {
      await fanficsItem.loadArticleCount();
      await timeout(500); // задержка
    }
  } // end function readCollection  

  await readCollection(); // вызвать функцию readCollection 

  if (fanficsArr.length == newFanficsArr.length) {
    await fs.writeFileSync('./fanfics.json', JSON.stringify(newFanficsArr, null, 2)); // записать новые данные в fanfics.json
  }
  else {
    console.log("Ошибка. Данные не могут быть сохранены");
  }
  console.timeEnd("Конец работы"); // завершить подсчет времени выполнения парсинга 
})();