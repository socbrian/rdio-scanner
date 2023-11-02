FROM node:21.1.0 as frontend

WORKDIR /app

COPY client/package.json client/package-lock.json ./

RUN npm ci

COPY client/. ./

RUN apk --no-cache --no-progress add build-base cmake git && \
    git clone https://github.com/USA-RedDragon/codec2 -b wasm --depth 1 && \
    cd codec2 && \
    mkdir build_linux && \
    cd build_linux && \
    cmake .. -D BUILD_SHARED_LIBS=OFF && \
    make && \
    cd .. && \
    mkdir build_wasm && \
    cd build_wasm && \
    cmake .. -DCMAKE_TOOLCHAIN_FILE=wasm32.cmake -DUNITTEST=FALSE -DGENERATE_CODEBOOK=`pwd`/../build_linux/src/generate_codebook && \
    make && \
    cp src/libcodec2.so src/libcodec2.wasm && \
    cd ../.. && \
    rm -rf codec2 && \
    apk del build-base cmake git

RUN npm run build

FROM golang:1.21.3-alpine as binary

WORKDIR /app

RUN apk --no-cache --no-progress add build-base cmake git && \
    git clone https://github.com/drowe67/codec2 -b 1.2.0 --depth 1 && \
    cd codec2 && \
    mkdir build && \
    cd build && \
    cmake .. -D BUILD_SHARED_LIBS=OFF && \
    make && \
    make install && \
    cd ../.. && \
    rm -rf codec2 && \
    mv /usr/local/lib/libcodec2* /usr/lib/ && \
    mv /usr/local/include/codec2 /usr/include/ && \
    apk del build-base cmake git

COPY server/. server/.
COPY --from=frontend /app/dist/ server/webapp/

RUN apk --no-cache --no-progress add build-base && \
    cd server && CGO_ENABLED=1 go build -o /rdio-scanner && \
    apk del build-base

FROM alpine:3.18.4

WORKDIR /app

ENV DOCKER=1

COPY --from=binary /rdio-scanner ./

RUN mkdir -p /app/data && \
    apk --no-cache --no-progress add ffmpeg mailcap tzdata

VOLUME [ "/app/data" ]

EXPOSE 3000

ENTRYPOINT [ "./rdio-scanner", "-base_dir", "/app/data" ]
