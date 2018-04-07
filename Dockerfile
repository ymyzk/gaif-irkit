FROM node:8.11-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

COPY index.js ./

CMD ["node", "index.js"]
