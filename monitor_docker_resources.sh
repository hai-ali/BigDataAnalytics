#commands that are needed to orchestrate, deploy and clean, not all commands need to run everytime

printf "........ Script started .......\n"

chmod +x monitor_docker_resources.sh
container_name="bigdataanalyticsha-dbstorage-1" # Replace with your container name
interval=60 # Interval in seconds (1 minute)
cd /Users/haider.aligjensidige.se/Documents/GitHub/BigDataAnalyticsHA
docker cp mongo_commands.js bigdataanalyticsha-dbstorage-1:/tmp/mongo_commands.js

#sleep 10 #just taking a breath

#docker-compose -f all-at-once.yaml stats

printf "\n........ cloneDetector Information ........\n\n"

while true; do # Run indefinitely

  printf "\n........ $(date +'%Y-%m-%d %H:%M:%S') ........\n\n"
  mongo_output=$(docker exec -it bigdataanalyticsha-dbstorage-1 mongosh /tmp/mongo_commands.js)
  printf "$mongo_output\n"
  sleep 10

done

printf  "\n........ Script finished ........\n"
