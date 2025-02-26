#commands that are needed to orchestrate, deploy and clean, not all commands need to run everytime

printf "........ Script started .......\n"

container_name="bigdataanalyticsha-dbstorage-1" # Replace with your container name
interval=60 # Interval in seconds (1 minute)
cd /Users/haider.aligjensidige.se/Documents/GitHub/BigDataAnalyticsHA

#sleep 10 #just taking a breath

# make the shell script executable
chmod +x monitor_docker_resources.sh

#docker-compose -f all-at-once.yaml stats

printf "\n........ MongoDB Information ........\n"

mongo_output=$(docker exec -it bigdataanalyticsha-dbstorage-1 mongosh \
  --eval "show dbs" \
  --eval "use cloneDetector" \
  --eval "show collections" \
  --eval "db.chunks.count()"\
  --eval "db.files.count()"\
  --eval "db.candidates.count()"\
  --eval "db.clones.count()")

printf "$mongo_output\n"

printf  "\n........ Script finished ........\n"

# Copy the JavaScript file into the container
docker cp mongo_commands.js bigdataanalyticsha-dbstorage-1:/tmp/mongo_commands.js

# Execute the JavaScript file
mongo_output2=$(docker exec -it bigdataanalyticsha-dbstorage-1 mongosh /tmp/mongo_commands.js)

# Print the output
printf "$mongo_output2\n"
