print("Chunks Count: " + db.getSiblingDB("cloneDetector").chunks.countDocuments());
print("Files Count: " + db.getSiblingDB("cloneDetector").files.countDocuments());
print("Candidates Count: " + db.getSiblingDB("cloneDetector").candidates.countDocuments());
print("Clones Count: " + db.getSiblingDB("cloneDetector").clones.countDocuments());