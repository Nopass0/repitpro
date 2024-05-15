FROM node:20.2.0

WORKDIR /server

COPY package*.json bun.lockb ./
RUN npm install -g bun && bun install

COPY . .

# Ensure environment variables are available during build
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN bun prisma generate

# Copy the wait script
COPY prisma/wait-for-postgres.sh /usr/local/bin/wait-for-postgres.sh
RUN chmod +x /usr/local/bin/wait-for-postgres.sh

CMD ["sh", "/usr/local/bin/wait-for-postgres.sh", "postgres", "bun prisma db push && bun run --watch src/server.ts"]
