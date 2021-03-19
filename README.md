# Ficbook Works Parser
Парсер для сайта [ficbook.net](https://ficbook.net), отслеживающий появление новых фанфиков в выбранных фандомах. 

Чтобы парсер заработал, нужно:
#### Создать проект
1. Установить на компьютер `Nodejs`.
2. Создать папку проекта и разместить внутри нее файлы `index.js`, `package.json` и `data.json` из репозитория.
3. Установить необходимые для работы парсера пакеты, введя в терминале (cmd в Windows) команду `[npm install]`. Вы должны находиться в папке проекта.
#### Создать данные
4. Создать в файле `data.json` объекты c названием нужного вам фэндома, ссылкой на него и количеством фанфиков в значении 0. Выглядеть должно аналогично: `{ "name": "Гарри Поттер", "url": "https://ficbook.net/fanfiction/books/harri_potter", "count": 0 }`. В самом файле имеется пример того, как должны выглядеть данные.
#### Запустить парсер 
5. Запустить парсер в терминале стандартной командой `[node index.js]` или `[node .]`. Первый запуск парсера добавит количество фанфиков в базу данных. Последующие запуски отобразят количество новых фанфиков при их наличии.

## Хранение данных в Mongodb
Данные можно хранить не в файле `data.json`, а в базе данных в облачном хранилище. 
Более продвинутые пользователи могут воспользоваться следующей инструкцией: [README-MONGODB](/mongodb/README-MONGODB.md)
