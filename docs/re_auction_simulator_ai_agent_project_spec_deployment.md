# RE‑Auction Simulator (AI‑Agent) — Solid MVP (Standalone) + Deployment

> Переписанная версия без интеграций: делаем **самостоятельный** аукцион+матчинг c профессиональным UX, прозрачной механикой клиринга и полной сквозной цепочкой (pipeline) — от создания аукциона до 面談/交渉 и отчёта. Ставка на «сильную базу», всё остальное — как расширение.

---

## 0) Принципы и цель
**Цель:** показать реальный, устойчивый аукционный контур для возобновляемой генерации (PV/ветер) с ясными правилами и «объяснимым» АИ-агентом.

**Опоры (pillars):**
1) **Чистая механика аукциона**: sealed‑bid, корректный клиринг (uniform‑price / pay‑as‑bid), детальный протокол тай‑брейков.
2) **Прозрачность**: публичный отчёт клиринга (без PII), аудиторский след (audit trail).
3) **Роли и доступы**: RBAC (Seller/Buyer/Operator/Admin), OTP/2FA опционально.
4) **Надёжность**: JST везде, валидации форм/данных, повторяемые результаты клиринга.
5) **Деплой и сопровождение**: бесплатные слои (Vercel/Railway/Neon), CI, резерв/откат.

---

## 1) Сквозной пайплайн (E2E)
1) Onboarding организации → пользователи/роли.
2) Регистрация объектов генерации (**Plants**).
3) Создание аукциона (**Area, окно торгов, режим клиринга**).
4) Публикация лотов (объём, резерв‑цена, allow_partial, кванты).
5) Подача закрытых заявок (цена/объём/условия).
6) **Lock** аукциона (окно закрыто) → проверка целостности.
7) Запуск клиринга (движок) → результаты/протокол.
8) Публикация отчёта (Aggregates + победители без лишних PII).
9) Перевод пар в **面談/交渉** (слоты, контакты, статус‑машина).
10) Черновик контракта (шаблон/заглушка, PDF/HTML).
11) Экспорт CSV/PDF.
12) Архивирование и аудит (immutable лог событий).

---

## 2) Функции ядра (обязательно)
- Создание/редактирование **Auctions/Lots**.
- Приём **Bids** (sealed‑bid), дедуп, валидации.
- **Clearing Engine**: `uniform‑price` и `pay‑as‑bid`, частичное исполнение, тай‑брейки.
- **Results & Report**: очистная цена, объёмы, причины отказа, графики S/D.
- **Interviews (面談)**: создание карточек, расписание, статусы.
- **RBAC/Auth**: роли, пароли/SSO‑заглушка, reset, (опц.) TOTP.
- **Audit Trail**: журнал действий (JSON), версии записей.
- **Export**: CSV/PDF для аукциона/матчей.
- **Rate‑limit & CORS**: защита API и корректная работа фронта.

### Дополнительно (после ядра)
- Watchlist/подписки на аукционы.
- Bulk‑загрузка лотов/ставок (CSV шаблоны).
- Уведомления (email/webhook).
- Sandbox‑режим для демо с авто‑генерацией данных.

---

## 3) Дизайн (профессионально, в духе реальных B2B‑бирж)
**Подход:** минималистичный «продакшн», не «AI‑generated». Чёткая иерархия, 8‑pt сетка, доступность, японская локаль.

- **Фреймворк:** Next.js (React + TS).
- **UI‑кит:** **shadcn/ui + Tailwind CSS** (кастомная тема под brand, без вычурных градиентов).
- **Таблицы:** **TanStack Table** (много колонок, группировка, фиксированные колонки, серверная пагинация).
- **Графики:** **ECharts** (supply/demand, кумулятивные кривые, no 3D, строгая сетка).
- **Состояние/запросы:** TanStack Query, формы — `react-hook-form + zod`.
- **Типографика:** Inter + Noto Sans JP; шкала `12/14/16/18/24/32`.
- **Палитра:** нейтральная (серые 50–900), акцент `#1677FF` (или бренд‑primary), success `#16a34a`, danger `#dc2626`.
- **Сетка и отступы:** 8‑pt (8/16/24/32); компактные контролы для таблиц.
- **Компоненты:**
  - Card‑layout с «Header → Content → Actions».
  - Filter‑чипсы, DateTimePicker (JST), Sticky‑actions для форм лота/ставки.
  - Пустые состояния с конкретными CTA.
  - Подписи и подсказки к каждому полю (с примерами, ед. измерения).
- **A11y:** контраст ≥4.5:1, фокус‑стили, клавиатурная навигация, aria‑метки.
- **Локализация:** i18n (JP/EN/RU), все даты в **JST**, явные форматы (`YYYY‑MM‑DD HH:mm JST`).

---

## 4) Данные и схема БД (PostgreSQL, ядро)
- `orgs(org_id, name, type)`
- `users(user_id, org_id, email, role, status, pwd_hash)`
- `plants(plant_id, org_id, type, prefecture, ac_mw, profile_json)`
- `auctions(auction_id, mode, area, starts_at, ends_at, status)`
- `lots(lot_id, auction_id, plant_id, min_vol_mwh, max_vol_mwh, reserve_price, step_mwh, allow_partial)`
- `bids(bid_id, auction_id, org_id, price_yen_kwh, volume_mwh, allow_partial, terms_json, created_at)`
- `matches(match_id, auction_id, lot_id, bid_id, cleared_price, cleared_volume, notes)`
- `interviews(iv_id, match_id, status, when_ts, contact, notes)`
- `contracts(contract_id, match_id, draft_url, status)`
- `audit_logs(log_id, actor, action, ref_id, ts, meta)`

**Индексы:** `(auction_id)`, `(area, starts_at)`, `(price_yen_kwh)`, `(org_id)`. Жёсткие FK. Статусы — через enum/тип.

---

## 5) API (FastAPI, ядро)
- `POST /api/auctions` — создать аукцион.
- `POST /api/lots` — создать лот.
- `POST /api/bids` — подать заявку.
- `POST /api/auctions/{id}/lock` — закрыть окно торгов.
- `POST /api/auctions/{id}/clear` — клиринг.
- `GET  /api/auctions/{id}/report` — отчёт клиринга.
- `POST /api/interviews` — создать 面談.
- `GET  /api/exports/{kind}` — CSV/PDF.
- `GET  /healthz` — health.

**Auth/RBAC:** JWT, роли по эндпоинтам; CORS → домен фронта.

---

## 6) Движок клиринга (Go или Python‑модуль)
**Режимы:** `uniform‑price`, `pay‑as‑bid`.
**Особенности:** сортировки O(N log N), частичное исполнение, приоритет по времени заявки, stable random seed для тай‑брейков.
**Выход:** `matches[]`, `cleared_price?`, полный **audit‑trace** (кто проиграл и почему).

---

## 7) АИ‑агент (Standalone)
**Роль:** оркестратор & валидатор & рассказчик. Без внешних интеграций — работает на внутренних данных (аукционы, лоты, заявки, правила).

### 7.1 Инструменты (контракты)
- `create_auction { mode, area, starts_at, ends_at } → { auction_id }`
- `create_lot { auction_id, plant_id, min_vol, max_vol, reserve_price, step, allow_partial } → { lot_id }`
- `validate_lot { lot_id } → { ok, warnings[] }`
- `submit_bid { auction_id, org_id, price, volume, allow_partial } → { bid_id, warnings[] }`
- `lock_auction { auction_id } → { ok }`
- `clear_auction { auction_id } → { matches[], cleared_price?, report_url }`
- `publish_results { auction_id } → { ok }`
- `create_interview { match_id, when_ts, contact } → { iv_id }`
- `generate_report { auction_id, format } → { url }`
- `export_csv { auction_id, kind } → { url }`
- `notify { to, subject, body } → { status }`
- `health_check { } → { ok, version }`

### 7.2 Политики/guardrails
- До клиринга **не раскрывать** содержимое заявок.
- Всегда указывать **период JST** и статус аукциона (draft/open/locked/cleared/published).
- Любое действие, меняющее состояние, подтверждать коротким «are‑you‑sure».
- При ошибке — диагностика и конкретные next‑steps.

### 7.3 Ответы (шаблоны)
- **Создание лота:** «Лот создан: {{lot_id}}. Проверьте: объём {{min..max}} MWh, шаг {{step}} MWh, резерв‑цена ¥/kWh. Запустить валидацию?»
- **Закрытие окна:** «Окно торгов закрыто в {{ts JST}}. Найдено заявок: {{N}}. Запустить клиринг {{mode}}?»
- **Клиринг завершён:** «Очистная цена {{P*}} ¥/kWh; исполнено {{V}} MWh. Отчёт готов: {{url}}. Перевести пары в 面談?»
- **面談:** «Назначил 面談 для {{match_id}} на {{ts JST}}. Контакт: {{contact}}.»

---

## 8) Deployment (Free‑tier)
**Фронт:** **Vercel** (Next.js).  
**Бэкенд:** **Railway** или **Render** (FastAPI).  
**БД:** **Neon** (Postgres).  
**CI/CD:** **GitHub Actions** (lint/test/build; миграции).  
**Cron (опц.):** Vercel Cron для напоминаний 面談.

**ENV:**
- Общие: `DATABASE_URL`, `TZ=Asia/Tokyo`.
- Backend: `ALLOWED_ORIGINS`, `JWT_SECRET`, `API_TOKEN` (cron), `RATE_LIMIT_*`.
- Frontend: `NEXT_PUBLIC_API_BASE`.

**Структура репо:**
```
repo/
  apps/
    frontend/   # Next.js + TS
    api/        # FastAPI (uvicorn)
    engine/     # clearing (Go или Python)
  db/
    migrations/
  .github/workflows/
    ci.yml  # тесты/линт
    deploy.yml  # деплой
```

**CORS:** разрешить `https://<project>.vercel.app` и `http://localhost:3000`.

**Backups:** `pg_dump` Neon по расписанию (Actions) → Releases.

---

## 9) Чек‑лист MVP (5–7 дней)
- [ ] БД и миграции; seed данных.
- [ ] FastAPI: CRUD auctions/lots/bids; auth/RBAC; CORS; health.
- [ ] Clearing Engine: два режима, протокол, тесты.
- [ ] UI: список аукционов, формы лота/ставки, клиринг‑дашборд, 面談‑карточка.
- [ ] Экспорт CSV/PDF.
- [ ] АИ‑агент: валидатор/оркестратор/репортинг (без внешних интеграций).

---

## 10) Метрики и SLO
- Клиринг ≤ 2 c при N≤5k заявок (P95).
- API агрегатов ≤ 300 мс (P95).
- Ошибки валидации < 1% от всех действий пользователя (цель по UX).
- Uptime фронта (Vercel) ≥ 99% для демо.

---

## 11) Скрипт демо (2–3 минуты)
1) Создать аукцион (режим uniform), опубликовать 2–3 лота.
2) От лица двух покупателей подать 3–5 ставок.
3) Закрыть окно → клиринг → открыть отчёт (S/D кривая, список победителей).
4) Перевести 1–2 пары в 面談; показать статусы.
5) Экспорт CSV/PDF.

---

## 12) Roadmap → после MVP
- Bulk‑операции, уведомления, webhooks.
- Мультивалютность/мультиединицы (¥/kWh ↔ ¥/MWh, шаги/шаблоны округления).
- Конструктор контрактов и цифровая подпись.
- История аукционов и поисковая витрина.

---

# Приложение A — **System Prompt** для АИ‑агента (Standalone)

**Роль:** Ты — АИ‑оркестратор аукционного сервиса. Помогаешь создавать аукционы и лоты, принимать заявки, закрывать окно торгов, запускать клиринг, публиковать результаты, организовывать 面談, формировать отчёты и экспорты. Работаешь **только** с внутренними данными и инструментами, без внешних интеграций.

**Цели:**
- Держать процесс в корректном состоянии (draft/open/locked/cleared/published).
- Гарантировать sealed‑bid до клиринга.
- Давать короткие, точные, проверяемые ответы (указывай JST‑время/периоды и ID сущностей).

**Инструменты (contracts):**
- `create_auction { mode, area, starts_at, ends_at } → { auction_id }`
- `create_lot { auction_id, plant_id, min_vol, max_vol, reserve_price, step, allow_partial } → { lot_id }`
- `validate_lot { lot_id } → { ok, warnings[] }`
- `submit_bid { auction_id, org_id, price, volume, allow_partial } → { bid_id, warnings[] }`
- `lock_auction { auction_id } → { ok }`
- `clear_auction { auction_id } → { matches[], cleared_price?, report_url }`
- `publish_results { auction_id } → { ok }`
- `create_interview { match_id, when_ts, contact } → { iv_id }`
- `generate_report { auction_id, format } → { url }`
- `export_csv { auction_id, kind } → { url }`
- `notify { to, subject, body } → { status }`
- `health_check { } → { ok, version }`

**Политики:**
1) Не раскрывай содержимое заявок до клиринга (можно говорить только агрегаты: количество заявок, минимумы/максимумы **без** привязки к участникам).
2) Всегда подтверждай действия, меняющие состояние (lock/clear/publish) коротким вопросом.
3) В ответах указывай: `area`, `auction_id`, режим, ключевые времена (JST), статус.
4) При ошибке объясняй причину и дай 1–3 конкретных шага, как исправить.
5) Форматируй шаги и ключевые поля в виде маркированных списков.

**Шаблоны ответов:**
- **Создание аукциона:**
  «Аукцион создан: `{{auction_id}}` ({{mode}}, {{area}}). Окно: `{{starts_at}}–{{ends_at}} JST`. Добавить лоты сейчас?»
- **Создание лота:**
  «Лот `{{lot_id}}` сохранён. Параметры: {{min..max}} MWh, шаг {{step}} MWh, резерв‑цена ¥/kWh, partial={{allow_partial}}. Запустить проверку?»
- **Закрытие окна:**
  «Аукцион `{{auction_id}}` закрыт в `{{ts JST}}`. Найдено заявок: `{{N}}`. Запустить клиринг (`{{mode}}`)?»
- **Клиринг завершён:**
  «Клиринг `{{auction_id}}` выполнен. Очистная цена: `{{P*}}` ¥/kWh; исполнено: `{{V}}` MWh. Отчёт: `{{url}}`. Перевести пары в 面談?»
- **面談:**
  «面談 создан для `{{match_id}}` на `{{when_ts JST}}`. Контакт: `{{contact}}`. Отправить приглашение?»

**Ошибки/валидации:**
- Неверные границы объёма/шага → предложи допустимый диапазон.
- Дубликаты заявок → предложи объединить или снять одну из них.
- Конфликты статусов (попытка клиринга до lock) → «Сначала выполните lock».

**Стиль:**
- Нейтрально‑деловой, короткие фразы, без жаргона.
- Поддерживай JP/EN/RU; в примерах времени — только **JST**.

**Формат вывода (рекомендованный):**
```
summary: <1–2 строки сути>
actions:
  - <кнопка/действие 1>
  - <кнопка/действие 2>
details:
  key: value
  key: value
```

