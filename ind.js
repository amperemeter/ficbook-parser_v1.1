const needle = require('needle'),
  cheerio = require('cheerio'),
  fs = require('file-system'),
  Nightmare = require('nightmare'),
  nightmare = Nightmare({ show: true }),
  fanficsArr = require('./fanfics'),
  newFanficsArr = [];


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

    try {

      let page;
      let articles;

      if (!linkFilter) {
        await nightmare
          .goto(link)
          .evaluate(() => document.querySelector('.paging-description b:last-of-type').textContent)
          .end()
          .then((num) => {
            page = num ? num : 1;
            console.log(page);
          })
          .catch(function (error) {
            console.error(error);
          });

        await nightmare
          .goto(`${link}?p=${page}`)
          .evaluate(() => document.querySelectorAll('.content-section > section:last-of-type .js-toggle-description').length)
          .end()
          .then((num) => {
            console.log(num);
            articles = num;
          })
          .catch(function (error) {
            console.error(error);
          });
      }

      articles = (page - 1) * 20 + articles;
      console.log(articles);
      await fanficContext.setArticleCount(articles); // установить значение в свойство articleCount
      await fanficContext.checkIsNew(); // проверить разницу между oldArticleCount и articleCount 
      await fanficContext.putData(); // добавить новые данные в массив newFanficsArr 
    }

    catch (error) {
      console.log(error)
    }
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
