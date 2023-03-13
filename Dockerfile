FROM node:18.15.0

WORKDIR /app

COPY . .

RUN yarn

RUN yarn run build

EXPOSE 3000

CMD ["npm", "run", "start"]
