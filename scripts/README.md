# Scripts

Вспомогательные скрипты для управления RE-Auction Simulator.

## Локальная разработка (без Docker)

### start-local.sh
Запускает все сервисы локально (PostgreSQL, API, Frontend) без использования Docker.

**Использование:**
```bash
./scripts/start-local.sh
```

**Требования:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- База данных `re_auction` создана и мигрирована

**Логи:**
- API: `/tmp/re-auction-api.log`
- Frontend: `/tmp/re-auction-frontend.log`

### stop-local.sh
Останавливает локально запущенные сервисы.

**Использование:**
```bash
./scripts/stop-local.sh
```

### status-local.sh
Проверяет статус локально запущенных сервисов.

**Использование:**
```bash
./scripts/status-local.sh
```

**Отображает:**
- Статус PostgreSQL
- Статус Backend API
- Статус Frontend
- Количество аукционов в БД

## Docker-окружение

### check-health.sh
Проверяет здоровье Docker-контейнеров и сервисов.

**Использование:**
```bash
./scripts/check-health.sh
# или через Makefile
make health
```

**Проверяет:**
- Docker установлен и работает
- Контейнеры запущены
- База данных готова
- API отвечает
- Frontend доступен

### quick-fix.sh
Быстрое решение распространенных проблем с Docker-окружением.

**Использование:**
```bash
./scripts/quick-fix.sh
# или через Makefile
make fix
```

**Выполняет:**
1. Останавливает все контейнеры
2. Удаляет старые volumes
3. Пересобирает образы
4. Запускает сервисы
5. Загружает seed-данные
6. Проверяет здоровье системы

## Примечания

- Все скрипты должны запускаться из **корня проекта**
- Для Docker-окружения используйте `Makefile` команды (рекомендуется)
- Локальные скрипты полезны для разработки без Docker
