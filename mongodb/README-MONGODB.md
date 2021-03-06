# Ficbook Works Parser
Парсер для сайта [ficbook.net](https://ficbook.net), отслеживающий появление новых фанфиков в выбранных фандомах и пэйрингах. 

Чтобы парсер заработал, нужно:
#### Создать проект
1. Установить на компьютер `Nodejs`.
2. Создать папку проекта и разместить внутри нее файлы [index-mongodb.js](index-mongodb.js) и [package-mongodb.json](package-mongodb.json) из репозитория. Переименовать `index-mongodb.js` и `package-mongodb.json` в `index.js` и `package.json` соответственно.
3. Установить необходимые для работы парсера пакеты, введя в терминале (cmd в Windows) команду `[npm install]`. Вы должны находиться в папке проекта.
#### Создать базу данных
4. Зарегистрироваться на сайте [cloud.mongodb.com](https://cloud.mongodb.com/) и создать новый кластер.
5. Создать в кластере базу данных с названием `fanficsdb`, а внутри нее коллекцию с названием `fanfics`. 
6. Создать юзера со всеми правами.
7. Создать в `fanfics` объекты c названием нужного вам фэндома или пэринга, ссылкой на него и количеством фанфиков в значении 0. 
* Выглядеть должно так: `{ "_id": {"$oid": "5fbd52194c8f4b6314d6b5e1"}, "name": "Гарри Поттер", "url": "https://ficbook.net/fanfiction/books/harri_potter", "count": 0 }`. ID создается автоматически. 
* В ссылке на пэйринг необходимо закодировать кириллицу в кодировке UTF-8 . Пример ссылки: `https://ficbook.net/pairings/%D0%9D%D1%83%D0%B0%D0%B4%D0%B0---%D0%9D%D1%83%D0%B0%D0%BB%D0%B0`).  
#### Подключиться к базе данных
8. Заменить в файле `index.js` строку `[uri = require('./uri');]` на строку `[uri = 'mongodb+srv://<username>:<password>@<clustername>.xmsaf.mongodb.net/fanficsdb?retryWrites=true&w=majority];` 
9. В этой же строке необходимо поменять значения `[username]`, `[password]`, `[clustername]` на ваши значения.
#### Запустить парсер 
10. Запустить парсер в терминале стандартной командой `[node index.js]` или `[node .]`. Первый запуск парсера добавит количество фанфиков в базу данных. Последующие запуски отобразят количество новых фанфиков при их наличии.
