FROM node:18.15.0

WORKDIR /app

COPY . .

RUN yarn

RUN yarn run build

EXPOSE 80

CMD ["npm", "run", "start"]
