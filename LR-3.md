# Лабораторная работа №3: Публикация нескольких статичных сайтов с помощью NGINX

**Домен:** sambuev-17.ru  
**IP сервера:** 139.100.225.99


## Предварительные условия

- Зарегистрировано доменное имя `sambuev-17.ru` (регистратор — reg.ru).
- Создан облачный сервер (VPS) с IP-адресом `139.100.225.99`.
- NGINX установлен и запущен (выполнено в рамках лабораторной работы №2).
- В DNS-зону добавлены A-записи для поддоменов `site1` и `site2`, указывающие на IP сервера.

> **Проверка DNS:**
> ```bash
> nslookup site1.sambuev-17.ru 8.8.8.8
> nslookup site2.sambuev-17.ru 8.8.8.8
> ```

---

## Ход выполнения работы

### 1. Сервер и установка NGINX

Сервер развёрнут на хостинге Selectel, ОС — Ubuntu 22.04. NGINX установлен в рамках предыдущей лабораторной работы:

```bash
apt update && apt install nginx -y
```

Проверка статуса:

```bash
systemctl status nginx
```

---

### 2. Настройка DNS

В панели управления регистратора reg.ru в DNS-зону домена `sambuev-17.ru` добавлены две A-записи для поддоменов:

| Тип | Имя  | Значение        |
|-----|------|-----------------|
| A   | site1 | 139.100.225.99 |
| A   | site2 | 139.100.225.99 |

<img width="1394" height="408" alt="image" src="https://github.com/user-attachments/assets/8b88dde7-5b7c-42ba-b5ea-2a568ffbe0c8" />


---

### 3. Создание директорий и страниц сайтов

Для каждого сайта созданы отдельные директории и тестовые HTML-страницы:

```bash
# Сайт 1
mkdir -p /var/www/site1.sambuev-17.ru/html
cat > /var/www/site1.sambuev-17.ru/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Сайт 1</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px">
  <h1>🌐 Сайт 1</h1>
  <p>site1.sambuev-17.ru — работает!</p>
</body>
</html>
EOF

# Сайт 2
mkdir -p /var/www/site2.sambuev-17.ru/html
cat > /var/www/site2.sambuev-17.ru/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Сайт 2</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px;background:#1a1a2e;color:#fff">
  <h1>🚀 Сайт 2</h1>
  <p>site2.sambuev-17.ru — работает!</p>
</body>
</html>
EOF
```

---

### 4. Создание конфигураций виртуальных хостов

В каталоге `/etc/nginx/sites-available/` созданы файлы конфигурации с именами, соответствующими доменным именам сайтов:

```bash
# Конфиг сайта 1
cat > /etc/nginx/sites-available/site1.sambuev-17.ru << 'EOF'
server {
    listen 80;
    server_name site1.sambuev-17.ru;
    root /var/www/site1.sambuev-17.ru/html;
    index index.html;
}
EOF

# Конфиг сайта 2
cat > /etc/nginx/sites-available/site2.sambuev-17.ru << 'EOF'
server {
    listen 80;
    server_name site2.sambuev-17.ru;
    root /var/www/site2.sambuev-17.ru/html;
    index index.html;
}
EOF
```

Проверка созданных файлов:

```bash
ls /etc/nginx/sites-available/
```

<img width="628" height="60" alt="image" src="https://github.com/user-attachments/assets/9b0ac609-babb-4954-bb8b-6e6f8f8f51a1" />


---

### 5. Создание символических ссылок

Для активации сайтов созданы символические ссылки из `sites-available` в `sites-enabled`:

```bash
ln -s /etc/nginx/sites-available/site1.sambuev-17.ru /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/site2.sambuev-17.ru /etc/nginx/sites-enabled/
```

Проверка символических ссылок:

```bash
ls -la /etc/nginx/sites-enabled/
```

<img width="1047" height="209" alt="image" src="https://github.com/user-attachments/assets/8375e04e-1d6c-44e6-a218-b946272b5a5a" />


Проверка конфигурации и перезагрузка NGINX:

```bash
nginx -t && systemctl reload nginx
```

<img width="637" height="76" alt="image" src="https://github.com/user-attachments/assets/5ccd183c-63ae-441e-b195-d1de34f534b3" />

---

### 6. Проверка работы сайтов по HTTP

После перезагрузки NGINX оба сайта стали доступны по HTTP:

- `http://site1.sambuev-17.ru` — отображается страница «Сайт 1»
- `http://site2.sambuev-17.ru` — отображается страница «Сайт 2»

<img width="1645" height="296" alt="image" src="https://github.com/user-attachments/assets/d53315a7-92e0-49b7-8912-259c3347ea7f" />


<img width="1562" height="309" alt="image" src="https://github.com/user-attachments/assets/c668bad7-31d7-4dee-aad7-fa3319a2258c" />


---

### 7. Выпуск SSL-сертификатов

Для каждого поддомена выпущен отдельный SSL-сертификат с помощью Certbot:

```bash
certbot --nginx -d site1.sambuev-17.ru
certbot --nginx -d site2.sambuev-17.ru
```

Certbot автоматически модифицировал конфигурации NGINX, добавив блоки для HTTPS и перенаправление с HTTP на HTTPS.

<img width="994" height="440" alt="image" src="https://github.com/user-attachments/assets/47c3ad51-6fc4-448d-87e2-17d302ebb212" />


<img width="970" height="441" alt="image" src="https://github.com/user-attachments/assets/ab45c423-617c-4080-9ecb-c80e94dbc7f0" />


Финальная конфигурация сайта после выпуска сертификата (пример для site1):

```nginx
server {
    listen 80;
    server_name site1.sambuev-17.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name site1.sambuev-17.ru;
    ssl_certificate /etc/letsencrypt/live/site1.sambuev-17.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/site1.sambuev-17.ru/privkey.pem;
    root /var/www/site1.sambuev-17.ru/html;
    index index.html;
}
```

---


Проверка статуса сертификатов:

```bash
certbot certificates
```

<img width="770" height="596" alt="image" src="https://github.com/user-attachments/assets/4a2d5d4c-8239-4bb4-a63a-be785fc1aa0b" />


