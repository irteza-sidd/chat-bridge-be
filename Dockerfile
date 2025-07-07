FROM node:22.0.0

WORKDIR /Chat

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3003

CMD [ "npm", "start" ]