# # Stage 1: Build React app
# FROM node:20.2.0 as builder

# WORKDIR /client

# # Копируем package.json и файл блокировки зависимостей, чтобы установить зависимости
# COPY package*.json ./

# # Устанавливаем зависимости
# RUN npm install

# RUN npm install -g bun && bun install
# # Копируем все файлы и создаем сборку приложения
# COPY . .

# # Собираем приложение
# RUN bun run build

# # Stage 2: Serve with Nginx
# FROM nginx:alpine

# # Устанавливаем OpenSSL для генерации сертификатов
# RUN apk add --no-cache openssl


# # Копируем сборку из этапа сборки
# COPY --from=builder /client/dist /usr/share/nginx/html

# # Копируем конфигурацию nginx
# COPY nginx.conf /etc/nginx/nginx.conf

# # Копируем скрипт начальной загрузки
# COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# RUN chmod +x /usr/local/bin/entrypoint.sh

# # Используем скрипт начальной загрузки
# ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# # Открываем порты
# EXPOSE 80 443

# Stage 1: Build React app
FROM node:20.2.0 as builder

WORKDIR /client

# Копируем package.json и файл блокировки зависимостей, чтобы установить зависимости
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

RUN npm install -g bun && bun install

# Копируем все файлы и создаем сборку приложения
COPY . .

# Собираем приложение
RUN bun run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Устанавливаем OpenSSL для генерации сертификатов
RUN apk add --no-cache openssl

# Копируем сборку из этапа сборки
COPY --from=builder /client/dist /usr/share/nginx/html

# # Копируем конфигурацию nginx
# COPY nginx.conf /etc/nginx/nginx.conf

# Копируем сертификаты
# COPY client/ssl/gs_intermediate_ca.crt /etc/nginx/ssl/gs_intermediate_ca.crt
# COPY client/ssl/www_repitpro_ru.key /etc/nginx/ssl/www_repitpro_ru.key
# COPY client/ssl/www_repitpro_ru.crt /etc/nginx/ssl/www_repitpro_ru.crt

# Копируем сборку из этапа сборки
COPY --from=builder /client/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем скрипт начальной загрузки
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Используем скрипт начальной загрузки
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Открываем порты
EXPOSE 80 443


# # Stage 1: Build the application
# # FROM node:20.2.0 AS builder
# # WORKDIR /client

# # COPY package*.json bun.lockb ./
# # RUN npm install -g bun && bun install

# # COPY . .
# # RUN npm run build

# # # Stage 2: Serve with Vite
# # FROM node:20.2.0

# # COPY package*.json bun.lockb ./
# # RUN npm install -g bun && bun install

# # WORKDIR /client

# # COPY package*.json ./
# # RUN npm install

# # COPY . .
# # COPY --from=builder /client/dist /app/dist

# # EXPOSE 80

# # CMD ["bun", "run", "dev:server"]

# Stage 1: Build React app
# FROM node:20.2.0 as builder

# WORKDIR /client

# # Копируем package.json и файл блокировки зависимостей, чтобы установить зависимости
# COPY package*.json ./

# # Устанавливаем зависимости
# RUN npm install

# RUN npm install -g bun && bun install

# # Копируем все файлы и создаем сборку приложения
# COPY . .

# # Собираем приложение
# RUN bun run build

# # Stage 2: Serve with Nginx
# FROM nginx:alpine

# # Устанавливаем OpenSSL для генерации сертификатов
# RUN apk add --no-cache openssl

# # Копируем сборку из этапа сборки
# COPY --from=builder /client/dist /usr/share/nginx/html

# # Копируем основную конфигурацию nginx
# COPY nginx.conf /etc/nginx/nginx.conf

# # Копируем конфигурацию сайта
# COPY default.conf /etc/nginx/conf.d/default.conf

# # Копируем сертификаты из директории проекта
# COPY client/ssl/gs_intermediate_ca.crt /etc/nginx/ssl/gs_intermediate_ca.crt
# COPY client/ssl/www_repitpro_ru.key /etc/nginx/ssl/www_repitpro_ru.key
# COPY client/ssl/www_repitpro_ru.crt /etc/nginx/ssl/www_repitpro_ru.crt

# # Копируем скрипт начальной загрузки
# COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# RUN chmod +x /usr/local/bin/entrypoint.sh

# # Используем скрипт начальной загрузки
# ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# # Открываем порты
# EXPOSE 80 443
