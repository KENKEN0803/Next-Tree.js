FROM node:16.19.0

WORKDIR /app

COPY package.json ./
RUN yarn

COPY . .

RUN yarn run build

EXPOSE 3000

CMD ["npm", "run", "start"]
