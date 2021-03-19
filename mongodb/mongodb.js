const needle = require('needle'),
  cheerio = require('cheerio'),
  assert = require('assert'),
  MongoClient = require('mongodb').MongoClient,
  uri = require('./uri');

//  Создать задержку
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

MongoClient.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true }, async function (err, client) {
  assert.equal(null, err);

  // Получить данные из БД
  const collection = client.db('fanficsdb').collection('fanfics');

  // Создать массив данных из БД
  const result = await collection.find({}).toArray()

  // Вывести в консоль кол-во фанфиков в БД
  console.log(`Всего фэндомов: ${result.length}\n`);

  // Начать подсчет времени выполнения парсинга 
  console.time("Конец работы");

  // Получить данные с сайта   
  async function scrape(link, fanficContext) {
    await needle('get', `${link}?p=1`)
      .then(async function (res, err) {
        // вычислить количество страниц на странице фэндома
        if (err) throw err;
        let $ = cheerio.load(res.body),
          page = $(".pagenav .paging-description b:last-of-type").html();
        page = page ? page : 1;

        await needle('get', `${link}?p=${page}`)
          .then(async function (res, err) {
            // вычислить количество фанфиков на всех страницах
            if (err) throw err;
            $ = cheerio.load(res.body);
            let articles = $(".fanfic-thumb-block:last-of-type .fanfic-inline").length;
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
  let fanficObj = {
    id: '',
    name: '',
    url: '',
    oldArticleCount: 0,
    articleCount: 0,
    loadArticleCount: async function () {
      await scrape(this.url, this);
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
    saveCount: async function () {
      // сохранить новое кол-во фанфиков в БД
      let difference = this.hasNew();
      if (difference !== 0) {
        const name = this.name,
          count = this.articleCount;
        try {
          await collection.updateOne({ name: name }, { $set: { count: count } });
        }
        catch (err) {
          console.log(`${err}`);
        }
      }
    }
  } // end fanficObj 

  //Создать новый массив с данными из БД     
  async function readCollection() {
    // создать пустой массив
    const fanfics = [];

    // создать объекты с использованием данных из БД и добавить их в массив fanfics
    for (let i = 0; i < result.length; i++) {
      let fanfic = Object.assign({}, fanficObj);
      fanfic.url = result[i].url;
      fanfic.name = result[i].name;
      fanfic.id = result[i]._id;
      fanfic.oldArticleCount = result[i].count;
      fanfics.push(fanfic);
    }

    // вызвать функцию loadArticleCount для каждого объекта из нового массива      
    for (let i = 0; i < fanfics.length; i++) {
      await fanfics[i].loadArticleCount();
      await timeout(500); // здержка
      // console.log(i + 1);
    }
  } // end function readCollection    

  await readCollection(); // вызвать функцию readCollection 
  client.close(); // закрыть подключение с БД
  console.timeEnd("Конец работы"); // завершить подсчет времени выполнения парсинга 
});
