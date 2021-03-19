const needle = require('needle'),
  cheerio = require('cheerio'),
  fs = require('file-system'),
  result = require('./data'),
  newResult = [];

// Начать подсчет времени выполнения парсинга 
console.time("Конец работы");

// Вывести в консоль кол-во фанфиков в data.json
console.log(`Всего фэндомов: ${result.length}\n`);



(async () => {



  // Получить данные с ficbook   
  async function scrape(link, fanficContext) {

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
            await fanficContext.putData(); // добавить новые данные в массив newResult
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
  let fanficObj = {
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
    putData: async function () {
      //создать объект с новыми данными и добавить их в массив newResult
      let newObject = new Object({
        "name": this.name,
        "url": this.url,
        "count": this.articleCount
      });
      newResult.push(newObject);
    }
  } // end fanficObj 



  //Создать массив с данными из data.json 
  async function readCollection() {
    const fanfics = [];

    // Создать объекты с использованием данных из data.json и добавить их в массив fanfics
    for (let i = 0; i < result.length; i++) {
      let fanfic = Object.assign({}, fanficObj);
      fanfic.url = result[i].url;
      fanfic.name = result[i].name;
      fanfic.oldArticleCount = result[i].count;
      fanfics.push(fanfic);
    }

    // Вызвать функцию loadArticleCount для каждого объекта из созданного массива      
    for (let i = 0; i < fanfics.length; i++) {
      await fanfics[i].loadArticleCount();
      // console.log(i + 1);
    }
  } // end function readCollection  



  await readCollection(); // вызвать функцию readCollection 
  await fs.writeFileSync('./data.json', JSON.stringify(newResult, null, 2)); // записать новые данные в data.json
  console.timeEnd("Конец работы"); // завершить подсчет времени выполнения парсинга 



})();