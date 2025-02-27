FROM ubuntu:22.04

WORKDIR /app

COPY monitor_docker_resources.sh mongo_commands.js ./

RUN apt-get update && \
    apt-get install -y gnupg curl lsb-release && \
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg && \
    DISTRO=$(lsb_release -cs) && \
    echo "deb [ arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${DISTRO}/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-mongosh

RUN chmod +x monitor_docker_resources.sh

CMD ["./monitor_docker_resources.sh"]