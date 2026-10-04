# Red AI — лендинг

Статический лендинг AI-сервиса для организации командировок Red AI. Вёрстка без фреймворков: HTML собирается из частей, стили пишутся на SCSS, сборка — на Gulp 5.

## Быстрый старт

Нужен Node.js 18+.

```bash
npm install
npm start
```

`npm start` собирает проект, следит за изменениями и поднимает локальный сервер BrowserSync, который раздаёт папку `app/`.

## Команды

| Команда | Что делает |
| --- | --- |
| `npm start` / `npx gulp` | сборка, watch и локальный сервер |
| `npm run build` / `npx gulp build` | разовая сборка: SCSS → очистка → HTML |
| `npx gulp watch` | только слежение за файлами, без сервера |
| `npx gulp sass` | только компиляция SCSS |
| `npx gulp fileinclude` | только сборка HTML |
| `npx gulp clean` | удалить из `app/` страницы без исходника в `src/html-layouts/` |

## Структура

```
src/
  html-layouts/
    index.html        страница: только подключения блоков
    blocks/           секции лендинга, один файл на блок (hero.html, proof.html, …)
    templates/        общие части: head, header, footer, sprite, modals, scripts
  scss/
    style.scss        единственная точка входа
    _global.scss      токены, брейкпоинты, миксины, базовые стили
    components/       стили компонентов (_<name>.scss)
app/                  результат сборки — именно он деплоится
  index.html          собирается из src, вручную не редактировать
  css/style.css       собирается из src, вручную не редактировать
  js/script.js        редактируется прямо здесь
  media/<блок>/       изображения и видео блоков
gulpfile.mjs          пайплайн сборки
```

Папки `src/` и `app/` коммитятся обе.

## Как устроено

- **HTML** собирается через `gulp-file-include`: `@include('blocks/hero.html')`, переменные с одним `@` (`head.html` принимает `title` и `description`).
- **CSS**: Dart Sass с модульной системой (`@use`), autoprefixer по browserslist `defaults`, на выходе — минифицированный `app/css/style.css`. Новый компонент — файл `src/scss/components/_<name>.scss`, начинающийся с `@use "global" as *;`, и строка `@use "components/<name>";` в `style.scss`.
- **JS**: один файл `app/js/script.js`, поведение — функции, вызываемые из `inits()`, обработчики делегированы на классы `js-*`. Swiper и IMask подгружаются лениво, когда нужный элемент приближается к экрану.
- **Библиотеки** (normalize.css, Swiper, IMask, AOS) лежат локально в `app/css/` и `app/js/`. Шрифты Geist и Playfair Display подключаются из Google Fonts.
- **Иконки** — инлайн SVG-спрайт в `templates/sprite.html`, использование: `<svg><use href="#i_name"></use></svg>`.

## Кэш и версии файлов

Сервер отдаёт статику с кэшем на неделю, поэтому при сборке HTML ко всем ссылкам на локальные файлы (css, js, изображения, шрифты, видео) автоматически дописывается `?v=<md5 содержимого>`. В исходниках пути пишутся без `?v`. Если файл в `app/` заменён вручную, HTML нужно пересобрать (`npm run build`), чтобы версия обновилась.

## Соглашения

- Классы по БЭМ, модификаторы через одно подчёркивание: `.block__element`, `.button_gradient`.
- Отступы: 2 пробела в SCSS/HTML, 4 — в `script.js`.
- Анимации появления — AOS (`data-aos="fade-up"` / `"fade"`); стили анимаций в `components/_aos.scss`. На первом экране (hero) `data-aos` не используется.
- Анимации работают всегда и не отключаются по `prefers-reduced-motion`.
- Комментарии в коде не оставляются.
