## Лабораторная работа №2: Получение сертификата Let's encrypt для Nginx (без Docker)

# 1. Установка и настройка веб-сервера Nginx:
```
apt update && apt install nginx -y
```
<img width="734" height="355" alt="image" src="https://github.com/user-attachments/assets/4405d234-039b-4a15-b810-41854ed8a1af" />

# 2. Создание страницы и конфига:
```
mkdir -p /var/www/sambuev-17.ru/html
echo "<h1>sambuev-17.ru works</h1>" > /var/www/sambuev-17.ru/html/index.html

cat > /etc/nginx/sites-available/sambuev-17.ru << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name sambuev-17.ru www.sambuev-17.ru;
    root /var/www/sambuev-17.ru/html;
    index index.html;
}
EOF

ln -s /etc/nginx/sites-available/sambuev-17.ru /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```
<img width="1641" height="254" alt="image" src="https://github.com/user-attachments/assets/e80cdf00-f40e-4e3b-aaf5-a818cb408577" />

# 3. Установка Certbot:
```
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot
```
<img width="612" height="138" alt="image" src="https://github.com/user-attachments/assets/824c7546-15fc-4942-a521-dc168037c33a" />

# 4. Получение сертификата:
```
certbot --nginx -d sambuev-17.ru -d www.sambuev-17.ru 
```
<img width="1015" height="885" alt="image" src="https://github.com/user-attachments/assets/91d12772-9c7f-4633-8570-c1ee1987bbf5" />

# 5. Проверка автообновления:
``` 
certbot renew --dry-run
```
<img width="791" height="299" alt="image" src="https://github.com/user-attachments/assets/4c59371a-e7c0-4233-ba75-77aac726a179" />

# 6. Проверка статуса сертификата:
```
certbot certificates
```
<img width="748" height="294" alt="image" src="https://github.com/user-attachments/assets/8d82ee88-cf38-4f05-be9f-ac3cc461e116" />

# 7. Проверка результата:
<img width="1391" height="168" alt="image" src="https://github.com/user-attachments/assets/c215e5bc-d6d9-4413-ac79-7cb185e9d0b1" />

