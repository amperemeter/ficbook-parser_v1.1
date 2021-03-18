# Ficbooks Works Parser
Парсер для сайта [ficbook.net](https://ficbook.net), отслеживающий появление новых фанфиков в выбранных фандомах. 
> В будущем появится новая доработанная версия парсера, но им уже можно спокойно пользоваться.

Чтобы парсер заработал, нужно:
1. Установить на компьютер `Nodejs`.
2. Создать в любом месте папку `ficbook-parser` (можно другое название).
3. Разместить внутри созданной папки файлы `index.js` и `package.json` из репозитория.
4. Установить необходимые для работы парсера пакеты, введя в терминале (cmd в Windows) команду `[npm i]`. Вы должны находиться в папке проекта.
5. Зарегистрироваться на сайте https://cloud.mongodb.com/ и создать новый кластер.
6. Создать в кластере базу данных с названием `fanficsdb`, а внутри нее коллекцию с названием `fanfics`. 
7. Создать юзера со всеми правами.
8. Создать в `fanfics` объекты c названием нужного вам фэндома, ссылкой на него и количеством фанфиков в значении 0. ID создается автоматически. Выглядеть должно так: `{ "_id": {"$oid": "5fbd52194c8f4b6314d6b5e1"}, "name": "Гарри Поттер", "url": "https://ficbook.net/fanfiction/books/harri_potter", "count": 0 }`
9. Добавить ТОЛЬКО последнему объекту свойство `last` со значением `true` (тип значения – `boolean`). Выглядеть должно так: `{ "_id": {"$oid": "5fbd52194c8f4b6314d6b5e1"}, "name": "Гарри Поттер", "url": "https://ficbook.net/fanfiction/books/harri_potter", "count": 0, "last": true}`
10. Заменить в файле `index.js` строку 6 `[uri = require('./uri');]` на строку с путем к вашей базе данных: `[uri = 'mongodb+srv://username:password@<clustername>.xmsaf.mongodb.net/fanficsdb?retryWrites=true&w=majority];` 
11. В этой же строке необходимо поменять значения `[username]`, `[password]`, `[clustername]`, `[fanficsdb]` на ваши значения.
12. Запустить парсер в терминале стандартной командой `[node .]` или `[node index.js]`. Первый запуск парсера добавит количество фанфиков в базу данных. Последующие запуски отобразят количество новых фанфиков при их наличии.
