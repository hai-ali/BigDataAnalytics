#commands that are needed to orchestrate, deploy and clean, not all commands need to run everytime

printf "....... Script started .......\n"

printf "....... Cleaning things up .......\n"

#Cleanup:

docker-compose -f all-at-once.yaml down

sleep 10 #making sure all are deleted before recreating

#Orchestration & Deployment:
cd /Users/haider.aligjensidige.se/Documents/GitHub/BigDataAnalyticsHA

# make the shell script executable
chmod +x deploy_docker_resources.sh

#Secrets:
printf "....... Creating secrets .......\n"

#Database service:
printf "\n....... MongoDB service .......\n"

printf "\n....... Deploying Product service .......\n"

#Product service & deployment:

docker build -t dochaider/cljdetector:cljdetector Containers/cljdetector
docker push dochaider/cljdetector:cljdetector
docker-compose -f all-at-once.yaml up

sleep 10

printf  "\n........ Script finished ........\n"