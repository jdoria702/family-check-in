FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]