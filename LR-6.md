# Лабораторная работа №6: Ping Pong веб-приложение на Python + Docker Compose

**Сервер:** 139.100.225.99  
**Язык:** Python (Flask)

## Структура проекта

```
pingpong/
├── app.py
├── Dockerfile
└── docker-compose.yml
```

---

## Реализация

### app.py — веб-приложение на Flask

Приложение читает порт и текст ответа из переменных окружения `PORT` и `PONG`. Реализованы два маршрута: корневой `/` возвращает HTML-страницу, `/ping` возвращает JSON-ответ.

```python
from flask import Flask
import os

app = Flask(__name__)

PORT = int(os.environ.get("PORT", 5000))
PONG = os.environ.get("PONG", "Pong!")

@app.route("/")
def ping():
    return f"<h1>🏓 {PONG}</h1><p>Instance running on port {PORT}</p>"

@app.route("/ping")
def pong():
    return {"message": PONG, "port": PORT}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
```

<img width="652" height="422" alt="image" src="https://github.com/user-attachments/assets/18193c27-459b-4fde-9072-2f403dc0871a" />

---

### Dockerfile

Образ на основе `python:3.12-slim`. Устанавливается Flask, копируется код приложения.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install flask
COPY app.py .
CMD ["python", "app.py"]
```

<img width="361" height="137" alt="image" src="https://github.com/user-attachments/assets/840abe8b-0041-4fae-a273-215f7dbb9061" />

---

### docker-compose.yml

Три независимых экземпляра приложения, каждый на отдельном порту с уникальным PONG-ответом, заданным через переменные окружения:

```yaml
services:
  app1:
    build: .
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
      - PONG=Pong from App 1 🏓

  app2:
    build: .
    ports:
      - "5002:5002"
    environment:
      - PORT=5002
      - PONG=Pong from App 2 🚀

  app3:
    build: .
    ports:
      - "5003:5003"
    environment:
      - PORT=5003
      - PONG=Pong from App 3 ⚡
```

<img width="441" height="554" alt="image" src="https://github.com/user-attachments/assets/63153f00-e269-44ba-9399-a89cf8ee3353" />

---

## Запуск

Сборка образов и запуск всех контейнеров одной командой:

```bash
docker compose up -d --build
```

Все три образа собраны успешно, контейнеры запущены:

```
✔ Image pingpong-app1  Built
✔ Image pingpong-app2  Built
✔ Image pingpong-app3  Built
✔ Container pingpong-app1-1  Started
✔ Container pingpong-app2-1  Started
✔ Container pingpong-app3-1  Started
```

<img width="605" height="318" alt="image" src="https://github.com/user-attachments/assets/6b9548ff-61dd-4016-84ff-1b95e2bc4780" />

Проверка запущенных контейнеров:

```bash
docker compose ps
```

<img width="1254" height="119" alt="image" src="https://github.com/user-attachments/assets/ffbc615d-9b21-47d7-91fd-4da6c1ced570" />

---

## Проверка работы

### Через curl

```bash
curl http://localhost:5001/ping
curl http://localhost:5002/ping
curl http://localhost:5003/ping
```

Результат:

<img width="523" height="136" alt="image" src="https://github.com/user-attachments/assets/b3b33899-12b4-481f-a3e9-e0c40b5001df" />

### Через браузер

Каждый экземпляр доступен по своему порту и возвращает уникальный HTML-ответ:

- `http://139.100.225.99:5001/`
- `http://139.100.225.99:5002/`
- `http://139.100.225.99:5003/`

<img width="1246" height="235" alt="image" src="https://github.com/user-attachments/assets/c31500f0-0be6-453b-ae57-ca4e9089aadd" />


<img width="1235" height="197" alt="image" src="https://github.com/user-attachments/assets/d5df9c77-e6e5-4967-85fb-b9fce923ccf4" />


<img width="1236" height="198" alt="image" src="https://github.com/user-attachments/assets/ae5970eb-b523-4b8d-82e2-1b71fbf4f048" />

