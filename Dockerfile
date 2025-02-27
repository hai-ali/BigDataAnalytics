FROM bash:5.1

WORKDIR /app

COPY monitor_docker_resources.sh mongo_commands.js ./

RUN apt-get update && apt-get install -y mongodb-clients

RUN chmod +x monitor_docker_resources.sh

CMD ["./monitor_docker_resources.sh"]