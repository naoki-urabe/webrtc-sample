FROM node:15.11.0-alpine as node
WORKDIR /webrtc-sample
RUN apk update --no-cache \
    && apk add git