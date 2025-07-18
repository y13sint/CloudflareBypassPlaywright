# Cloudflare Bypass с помощью Playwright

## Описание
Этот проект демонстрирует способ автоматического обхода защиты Cloudflare ("Checking your browser before accessing…") c использованием фреймворка [Playwright](https://playwright.dev/). Скрипт запускает невидимый браузер, проходит проверку Cloudflare и возвращает содержимое целевой страницы.

> **Важно:** библиотека `playwright` используется в фиксированной версии **1.25.0**. 

## Требования
1. **Node.js** >= 14
2. **npm** (или `yarn` / `pnpm`)
3. Свободное место на диске для установки браузеров Playwright (≈ 300 МБ)

## Установка
```bash
# 1. Клонируйте репозиторий
$ git clone https://github.com/y13sint/CloudflareBypassPlaywright
$ cd CloudflareBypassPlaywright

# 2. Установите зависимости
$ npm install

# 3. (Необязательно) Установите только нужные браузеры
$ npx playwright install firefox
```
В `package.json` уже зафиксирована версия `playwright@1.25.0`, поэтому автоматически будет установлена именно она.

## Переменные окружения
Создайте файл `.env` в корне проекта и задайте единственную переменную:
```env
TARGET_URL=https://example.com   # URL, который защищён Cloudflare
```

## Запуск
```bash
npm start
```
Скрипт автоматически откроет **Firefox** (версия, поставляемая Playwright 1.25.0), подождёт прохождения проверки Cloudflare и выведет HTML-код страницы либо сохранит куки для дальнейших запросов.

## Частые проблемы
* **"firefox executable doesn't exist"** – убедитесь, что вы выполнили `npx playwright install firefox`.
* **Ошибка сертификата** – укажите корректный прокси или запустите без прокси.
* **Обновления Cloudflare** – при изменении механизма проверки Cloudflare скрипт может перестать работать. В таком случае попробуйте обновить логику в `cloudflare-bypass.js` или зафиксировать более старую версию браузера.

## Лицензия
MIT 


