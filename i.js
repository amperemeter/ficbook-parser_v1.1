const tress = require('tress'),
  needle = require('needle'),
  cheerio = require('cheerio'),
  assert = require('assert'),
  MongoClient = require('mongodb').MongoClient,
  uri = require('./uri');

MongoClient.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true }, async function (err, client) {
  assert.equal(null, err);
  const collection = client.db('fanficsdb').collection('fanfics');

  async function scrape(link, fanficContext) {
    await fanficContext.setArticleCount(0); // установить значение в свойство articleCount
    console.log(3);
    await fanficContext.checkIsNew(); // проверить разницу между oldArticleCount и articleCount 
    console.log(4);
    await fanficContext.saveCount(); // сохранить значение articleCount в БД   
    console.log(5);
  }

  // Рабочий объект  
  let fanficObj = {
    id: '',
    name: '',
    url: '',
    oldArticleCount: 0,
    articleCount: 0,
    last: false,
    loadArticleCount: async function () {
      await scrape(this.url, this);
      console.log(2);
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
      const name = this.name,
        count = this.articleCount;
      try {
        await collection.updateOne({ name: name }, { $set: { count: count } });
        console.log(97);
      }
      catch (err) {
        console.log(`${err}`);
      }
    }

  } // end fanficObj   

  //Создать массив с данными из БД     
  async function readCollection() {
    // получить массив данных из БД
    const result = await collection.find({}).toArray(),
      fanfics = [];
    console.log(`Всего фэндомов: ${result.length}\n`);
    console.time("Конец работы");

    // Создать объекты с использованием данных из БД и добавить их в массив fanfics
    for (let i = 0; i < result.length; i++) {
      // создать архив с объектами
      let fanfic = Object.assign({}, fanficObj);
      fanfic.url = result[i].url;
      fanfic.name = result[i].name;
      fanfic.id = result[i]._id;
      fanfic.oldArticleCount = result[i].count;
      fanfic.last = result[i].last;
      fanfics.push(fanfic);
    }

    // Вызвать функцию loadArticleCount для каждого элемента созданного массива с объектами с задержкой      
    for (let i = 0; i < 3; i++) {
      //       setTimeout(function () {
      await fanfics[i].loadArticleCount();
      console.log(1);
      //       }, 500 + (500 * i));
    }

  } // end function readCollection    

  await readCollection(); // вызвать функцию readCollection 
  console.log(98989898989898);
  await client.close();
  console.log(99);
  console.timeEnd("Конец работы");
  console.log(100);
});
