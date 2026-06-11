# Лабораторная работа №5: Запуск контейнеров и подключение Volumes

**Сервер:** 139.100.225.99

## Ход выполнения работы

### 1. Запуск контейнеров

Запущены два контейнера NGINX с монтированием директорий хост-системы внутрь контейнеров через механизм Volumes (`-v`). Каждый контейнер обслуживает отдельный сайт на своём порту.

```bash
docker run -d --name container1 \
  -p 8081:80 \
  -v /var/www/site1:/usr/share/nginx/html \
  nginx

docker run -d --name container2 \
  -p 8082:80 \
  -v /var/www/site2:/usr/share/nginx/html \
  nginx
```

<img width="974" height="155" alt="image" src="https://github.com/user-attachments/assets/69c027cf-f013-41b8-9508-6402e3183f03" />


---

### 2. Проверка запущенных контейнеров

После запуска выполнена проверка состояния контейнеров:

```bash
docker ps
```

Оба контейнера отображаются со статусом `Up`, привязаны к портам 8081 и 8082.

<img width="974" height="94" alt="image" src="https://github.com/user-attachments/assets/d2957d9d-cd47-4ee5-bece-1b89a828c1b5" />


---

### 3. Проверка логов контейнера №1

Просмотр логов первого контейнера:

```bash
docker logs container1
```

<img width="974" height="694" alt="image" src="https://github.com/user-attachments/assets/1f6f01ac-95bd-4141-9684-95225f1fb3b9" />

---

### 4. Проверка логов контейнера №2

Просмотр логов второго контейнера:

```bash
docker logs container2
```

<img width="974" height="505" alt="image" src="https://github.com/user-attachments/assets/0ed2b5f8-b2d5-4e54-be49-b085a86742d2" />

---

### 5. Структура каталогов

Созданы директории для двух сайтов с HTML-файлами, которые монтируются в контейнеры через Volume:

```bash
# Создание директорий
mkdir -p /var/www/site1
mkdir -p /var/www/site2

# Создание страниц
echo "<h1>Сайт 1</h1>" > /var/www/site1/index.html
echo "<h1>Сайт 2</h1>" > /var/www/site2/index.html
```

Просмотр структуры каталогов:

```bash
ls -la /var/www/
ls -la /var/www/site1/
ls -la /var/www/site2/
```

<img width="974" height="168" alt="image" src="https://github.com/user-attachments/assets/c646c89b-de65-4c53-9bf5-2d0464c87525" />

---

### 6. Сайт 1

Проверка работы первого сайта в браузере по адресу `http://139.100.225.99:8081`:

<img width="974" height="573" alt="image" src="https://github.com/user-attachments/assets/2051179c-bf70-44f0-976f-0ffcbfb108c9" />

---

### 7. Сайт 2

Проверка работы второго сайта в браузере по адресу `http://139.100.225.99:8082`:

<img width="974" height="573" alt="image" src="https://github.com/user-attachments/assets/edfc477c-361d-4f72-91c8-136309763017" />
