print("Chunks Count: " + db.getSiblingDB("cloneDetector").chunks.countDocuments());
print("Files Count: " + db.getSiblingDB("cloneDetector").files.countDocuments());
print("Candidates Count: " + db.getSiblingDB("cloneDetector").candidates.countDocuments());
print("Clones Count: " + db.getSiblingDB("cloneDetector").clones.countDocuments());

// latest information from statusUpdates
var latestUpdate = db.getSiblingDB("cloneDetector").statusUpdates.find().sort({ timestamp: -1 }).limit(1).toArray()[0];

if (latestUpdate) {
  print("Latest Status Update: " + JSON.stringify(latestUpdate));
} else {
  print("No status updates found.");
}