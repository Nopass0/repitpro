FROM node:20.2.0

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

WORKDIR /prisma

RUN chmod +x wait-for-postgres.sh
RUN npx prisma generate

RUN apt update
RUN apt --assume-yes install postgresql-client

RUN apt --assume-yes install dos2unix
RUN dos2unix wait-for-postgres.sh
# RUN dos2unix db-init.sh

WORKDIR /

EXPOSE 3000
# RUN npx prisma db push
ENTRYPOINT ["./docker/db-init.sh"]

CMD sh ./prisma/wait-for-postgres.sh postgres postgres npx prisma migrate deploy && npx prisma db seed --preview-feature && cd .. && npm run start
# CMD ["npm", "start"]


# FROM node:20.2.0

# WORKDIR /

# COPY package*.json ./

# RUN npm install

# COPY . .

# WORKDIR /prisma

# RUN npx prisma db push
# RUN npx prisma generate

# WORKDIR /

# EXPOSE 3000

# CMD ["npm", "start"]