const needle = require('needle'),
  cheerio = require('cheerio'),
  assert = require('assert'),
  MongoClient = require('mongodb').MongoClient,
  uri = require('./uri');

// Создать задержку
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

MongoClient.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true }, async function (err, client) {
  assert.equal(null, err);

  // Получить данные из БД и создать массив данных
  const collection = client.db('fanficsdb').collection('fanfics'),
    fanficsArr = await collection.find({}).toArray()

  // Вывести в консоль кол-во фанфиков в БД
  const fanficsLength = fanficsArr.length;
  console.log(`Всего фэндомов: ${fanficsLength}\n`);

  // Начать подсчет времени выполнения парсинга 
  console.time("Конец работы");

  // Получить данные с сайта   
  async function scrape(fanficContext, link) {
    // проверить, к какому типу относится ссылка
    const linkFilter = link.includes('fandom_filter');
    // дополнить ссылку со страницы фильтра необходимыми параметрами
    let urlOuter = '';
    linkFilter && (urlOuter = `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!&p=1#result`);
    // кодировать кириллицу
    // encodedUrlOuter = encodeURI('Корнелиус Хикки');

    await needle('get', linkFilter ? urlOuter : `${link}?p=1`)
      .then(async function (res, err) {
        if (err) throw err;
        // вычислить количество страниц на странице фэндома
        let $ = cheerio.load(res.body),
          page = $(".pagenav .paging-description b:last-of-type").html();
        page = page ? page : 1;
        // дополнить ссылку со страницы фильтра необходимыми параметрами
        let urlInner = '';
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
            await fanficContext.saveCount(); // сохранить значение articleCount в БД 
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
    id: '',
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
        console.log(`${this.name}\nновых ${difference}\n${this.url}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!&p=1#result\n`);
      } else if (difference > 0) {
        console.log(`${this.name}\nновых ${difference}\n${this.url}\n`);
      } else if (difference < 0) {
        console.log(`${this.name}\nудалено ${difference}\n`);
      }
    },
    saveCount: async function () {
      // сохранить новое кол-во фанфиков в БД
      const difference = this.hasNew();
      if (difference !== 0) {
        try {
          await collection.updateOne({ url: this.url }, { $set: { count: this.articleCount } });
        }
        catch (err) {
          console.log(`${err}`);
        }
      }
    }
  } // end fanficProto 

  //Создать новый массив с данными из БД     
  async function readCollection() {
    // создать пустой массив
    const fanficsArrCopy = [];

    // создать объекты с использованием данных из БД и добавить их в массив fanficsArrCopy
    for (const fanficsItem of fanficsArr) {
      const fanficObj = Object.assign({}, fanficProto);
      fanficObj.id = fanficsItem._id;
      fanficObj.name = fanficsItem.name;
      fanficObj.url = fanficsItem.url;
      fanficObj.oldArticleCount = fanficsItem.count;
      fanficsArrCopy.push(fanficObj);
    }

    // вызвать функцию loadArticleCount для каждого объекта из нового массива   
    for (let i = 0; i < fanficsLength; i++) {
      await fanficsArrCopy[i].loadArticleCount();
      await timeout(500); // задержка
      // console.log(i + 1);
    }
  } // end function readCollection    

  await readCollection(); // вызвать функцию readCollection 
  client.close(); // закрыть подключение с БД
  console.timeEnd("Конец работы"); // завершить подсчет времени выполнения парсинга 
});