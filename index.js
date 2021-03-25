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
  // Получить данные с ficbook   
  async function scrape(fanficContext, link) {

    await needle('get', `${link}?p=1`)
      // вычислить количество страниц на странице фэндома
      .then(async function (res, err) {
        if (err) throw err;
        let $ = cheerio.load(res.body),
          page = $(".pagenav .paging-description b:last-of-type").html();
        page = page ? page : 1;

        await needle('get', `${link}?p=${page}`)
          // вычислить количество фанфиков на всех страницах
          .then(async function (res, err) {
            if (err) throw err;
            $ = cheerio.load(res.body);
            let articles = $(".fanfic-thumb-block:last-of-type .fanfic-inline").length;
            if (page != 1) {
              articles = (page - 1) * 20 + articles;
            }
            await fanficContext.setArticleCount(articles); // установить значение в свойство articleCount
            await fanficContext.checkIsNew(); // проверить разницу между oldArticleCount и articleCount 
            await fanficContext.putData(); // добавить новые данные в массив newFanficsArr
          })
          .catch(function (err) {
            console.log(err)
          });
      })
      .catch(function (err) {
        console.log(err)
      });

  } // end function scrape

  // Рабочий объект  
  let fanficProto = {
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
      // вывести после сравнения количество добавленных фанфиков  
      let difference = this.hasNew();
      if (difference > 0) {
        console.log(`${this.name}\nновых ${difference}\n${this.url}\n`);
      }
      if (difference < 0) {
        console.log(`${this.name}\nудалено ${difference}\n`);
      }
    },
    putData: async function () {
      // cоздать объект с новыми данными и добавить их в массив newFanficsArr
      let newFanficsObject = new Object({
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
    for (let fanficsItem of fanficsArr) {
      let fanficObj = Object.assign({}, fanficProto);
      fanficObj.name = fanficsItem.name;
      fanficObj.url = fanficsItem.url;
      fanficObj.oldArticleCount = fanficsItem.count;
      fanficsArrCopy.push(fanficObj);
    }

    // вызвать функцию loadArticleCount для каждого объекта из созданного массива      
    for (let fanficsItem of fanficsArrCopy) {
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
