FROM node:22.15.0

LABEL "server"="client-websocket"
LABEL maintainer="joseagraz29@gmail.com"
LABEL version="1.0"

WORKDIR /usr/src/app

COPY package*.json /usr/src/app/

RUN npm install

COPY . .

FROM nginx:latest

COPY --from=build /usr/src/app/build/ /usr/share/nginx/html
COPY --from=build /usr/src/app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80:80
CMD ["nginx", "-g", "daemon off;"]
