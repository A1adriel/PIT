# AnonChat

Анонимный чат в реальном времени. Создавай комнаты, делись кодом с друзьями и общайся без регистрации.

🌐 **Живой сайт:** https://sambuev-17.ru

---

## Стек технологий

| Компонент   | Технология              |
|-------------|-------------------------|
| Frontend    | React 18 + Vite         |
| Backend     | FastAPI (Python 3.12)   |
| База данных | PostgreSQL 16           |
| WebSocket   | FastAPI WebSocket       |
| Web-сервер  | NGINX                   |
| SSL         | Let's Encrypt + Certbot |
| Оркестрация | Docker Compose          |

---

## Архитектура

```
Клиент (браузер)
  │
  ▼
NGINX (80 / 443)
  ├── /          → frontend  (React SPA, порт 80)
  ├── /api/      → backend   (FastAPI REST, порт 8000)
  └── /ws/       → backend   (FastAPI WebSocket, порт 8000)
                      │
                      ▼
                 PostgreSQL (порт 5432)
```

---

## Быстрый старт

### 1. Требования

- Ubuntu 22.04 (или другой Linux)
- Docker 29.5+
- docker-compose-plugin
- Зарегистрированный домен с A-записью, указывающей на IP сервера
- Открытые порты: 80, 443

### 2. Установка Docker и плагина Compose

```bash
apt update
apt install -y docker-ce docker-ce-cli containerd.io
apt install -y docker-compose-plugin
```

### 3. Клонировать репозиторий

```bash
git clone https://github.com/A1adriel/PIT.git)
cd PIT
cd Курсовая\ работа/
```

### 4. Настроить NGINX для HTTP (без SSL)

```bash
cat > nginx/default.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
EOF
```

### 5. Собрать и запустить контейнеры

```bash
# Если путь содержит пробелы — использовать флаг -p
docker compose -p chatapp up -d --build
```

Проверка что все запущены:

```bash
docker compose -p chatapp ps
```

Должно быть 5 контейнеров со статусом `Running`:
- `chatapp-db-1`
- `chatapp-backend-1`
- `chatapp-frontend-1`
- `chatapp-nginx-1`
- `chatapp-certbot-1`

### 6. Выпустить SSL-сертификат

Остановить nginx чтобы освободить порт 80:

```bash
docker compose -p chatapp stop nginx
```

Выпустить сертификат через системный certbot (предварительно установить: `snap install --classic certbot`):

```bash
certbot certonly --standalone \
  -d ВАШ_ДОМЕН \
  --email ВАШ_EMAIL \
  --agree-tos \
  --no-eff-email \
  --non-interactive
```

Запустить nginx обратно:

```bash
docker compose -p chatapp start nginx
```

### 7. Обновить конфиг NGINX для HTTPS

```bash
cat > nginx/default.conf << 'EOF'
server {
    listen 80;
    server_name ВАШ_ДОМЕН;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ВАШ_ДОМЕН;

    ssl_certificate /etc/letsencrypt/live/ВАШ_ДОМЕН/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ВАШ_ДОМЕН/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
EOF
```

Добавить монтирование системных сертификатов в docker-compose.yml для сервиса nginx:

```yaml
volumes:
  - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

Пересоздать контейнер nginx:

```bash
docker compose -p chatapp stop nginx
docker compose -p chatapp rm -f nginx
docker compose -p chatapp up -d nginx
```

Открыть в браузере: `https://ВАШ_ДОМЕН` — должен появиться замок и экран входа в чат.

---

## Управление

```bash
# Запуск
docker compose -p chatapp up -d

# Остановка
docker compose -p chatapp down

# Логи всех сервисов
docker compose -p chatapp logs -f

# Логи конкретного сервиса
docker compose -p chatapp logs nginx --tail=20

# Пересборка после изменений кода
docker compose -p chatapp up -d --build
```

---

## API эндпоинты

| Метод  | URL                        | Описание                      |
|--------|----------------------------|-------------------------------|
| POST   | /api/rooms                 | Создать комнату               |
| GET    | /api/rooms/{code}          | Получить информацию о комнате |
| GET    | /api/rooms/{code}/messages | История сообщений             |
| GET    | /api/health                | Проверка состояния сервиса    |
| WS     | /ws/{room_code}/{username} | WebSocket подключение         |

---

## Переменные окружения

| Переменная        | Описание                        | По умолчанию                          |
|-------------------|---------------------------------|---------------------------------------|
| DATABASE_URL      | Строка подключения к PostgreSQL | postgresql://chat:chat@db:5432/chatdb |
| POSTGRES_USER     | Пользователь БД                 | chat                                  |
| POSTGRES_PASSWORD | Пароль БД                       | chat                                  |
| POSTGRES_DB       | Имя базы данных                 | chatdb                                |

> ⚠️ В продакшне смените пароли через файл `.env`

---

## Возможные проблемы

**`project name must not be empty`** — папка содержит пробелы, используй флаг `-p`:
```bash
docker compose -p chatapp up -d
```

**`host not found in upstream "frontend"`** — конфиг nginx слетел на SSL-версию, перезапиши `nginx/default.conf` на HTTP-версию и перезапусти nginx.

**`address already in use` (порт 80/443)** — остановить системный nginx:
```bash
systemctl stop nginx
```

**Браузер принудительно редиректит на HTTPS** — открыть в режиме инкогнито или выполнить `ipconfig /flushdns` на Windows.
