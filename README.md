# Ficbook Works Parser
Парсер для сайта [ficbook.net](https://ficbook.net), отслеживающий появление новых фанфиков в выбранных фандомах или пэйрингах. 

Чтобы парсер заработал, нужно:
#### Создать проект
1. Установить на компьютер `Nodejs`.
2. Создать папку проекта и разместить внутри нее файлы [index.js](index.js), [package.json](package.json) и [fanfics.json](fanfics.json) из репозитория.
3. Установить необходимые для работы парсера пакеты, введя в терминале (cmd в Windows) команду `[npm install]`. Вы должны находиться в папке проекта.
#### Создать данные
4. Создать в файле `fanfics.json` объекты c названием нужного вам фэндома или пэйринга, ссылкой на него и количеством фанфиков в значении 0. Выглядеть должно аналогично: `{ "name": "Гарри Поттер", "url": "https://ficbook.net/fanfiction/books/harri_potter", "count": 0 }`. Если в ссылке имеется кириллица, она должна быть закодирована в кодировке UTF-8. В самом файле имеется пример того, как должны выглядеть данные.
#### Запустить парсер 
5. Запустить парсер в терминале стандартной командой `[node index.js]` или `[node .]`. Первый запуск парсера добавит количество фанфиков в базу данных. Последующие запуски отобразят количество новых фанфиков при их наличии.

## Хранение данных в Mongodb
При желании вы можете хранить данные не локально в файле `fanfics.json`, а в базе данных в облачном хранилище. 
Для этого воспользуйтесь [следующей инструкцией](mongodb/README-MONGODB.md). Если вы всё же хотите хранить данные локально, рекомендую на случай непредвиденных ошибок создать копию файла `fanfics.json`.

## Дополнительно
Если вам кажется, что во время парсинга что-то пошло не так, нажмите `[CTRL+C]` для завершения процесса.
