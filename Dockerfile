FROM node:21.1.0 as frontend

WORKDIR /app

COPY client/package.json client/package-lock.json ./

RUN npm ci

COPY client/. ./

RUN npm run build

FROM golang:1.21.3 as binary

WORKDIR /app

COPY server/. server/.
COPY --from=frontend /app/dist/ server/webapp/

RUN cd server && CGO_ENABLED=0 go build -o /rdio-scanner

FROM alpine:3.18.4

WORKDIR /app

ENV DOCKER=1

COPY --from=binary /rdio-scanner ./

RUN mkdir -p /app/data && \
    apk --no-cache --no-progress add ffmpeg mailcap tzdata

VOLUME [ "/app/data" ]

EXPOSE 3000

ENTRYPOINT [ "./rdio-scanner", "-base_dir", "/app/data" ]