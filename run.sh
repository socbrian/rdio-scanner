#!/bin/sh

# Build the Docker image (replace with your actual path and tag)
docker build -t Dockerfile

#run
docker run --detach --env TZ=America/NewYork --name rdio-scanner --publish 3000:3000 --restart always  --volume ~/.rdio-scanner:/app/data Dockerfile
