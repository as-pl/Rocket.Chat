#!/usr/bin/env bash
set -euo pipefail

MONGO_CONTAINER="rc-mongo"
NETWORK="rocketchat-dev"
REPLSET="rs0"
BACKUP_FILE="${1:-backup.gz}"
ROOT_URL="http://localhost:3000"
OAUTH_BACKEND_URL="https://localhost:8082"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "Removing existing container if present..."
docker rm -f "$MONGO_CONTAINER" >/dev/null 2>&1 || true

echo "Ensuring docker network exists..."
docker network create "$NETWORK" >/dev/null 2>&1 || true

echo "Starting mongo container..."
docker run -d \
  --name "$MONGO_CONTAINER" \
  --network "$NETWORK" \
  -p 27017:27017 \
  -v rc-mongo-data:/data/db \
  mongodb/mongodb-community-server:8.2-ubuntu2204 \
  --replSet "$REPLSET" --bind_ip_all >/dev/null

# Give mongod a moment to start
sleep 5

echo "Initiating replica set..."
docker exec -i "$MONGO_CONTAINER" mongosh --quiet --eval "
rs.initiate({
  _id: \"$REPLSET\",
  members: [{ _id: 0, host: \"$MONGO_CONTAINER:27017\" }]
});
" || true

# Let RS settle
sleep 2

echo "Copying backup into container..."
docker cp "$BACKUP_FILE" "$MONGO_CONTAINER":/backup.gz

echo "Restoring backup..."
docker exec -i "$MONGO_CONTAINER" mongorestore \
  --gzip --archive=/backup.gz --drop \
  --uri="mongodb://$MONGO_CONTAINER:27017/?replicaSet=$REPLSET" \
  --nsInclude='rocketchat.*' \
  --nsExclude='admin.*' --nsExclude='config.*' --nsExclude='local.*'

echo "Reconfiguring replica set host to localhost for local connections..."
docker exec -i "$MONGO_CONTAINER" mongosh --quiet --eval "
try {
  cfg = rs.conf();
  cfg.members[0].host = \"localhost:27017\";
  rs.reconfig(cfg, { force: true });
} catch (e) { print(e); }
"

sleep 2

echo "Applying Rocket.Chat settings for local dev..."
docker exec -i "$MONGO_CONTAINER" mongosh --quiet --eval "
const db = db.getSiblingDB('rocketchat');

db.rocketchat_settings.updateOne(
  { _id: 'Show_Setup_Wizard' },
  { \$set: { value: 'completed', packageValue: 'completed', valueSource: 'value' } },
  { upsert: true }
);

db.rocketchat_settings.updateOne(
  { _id: 'Site_Url' },
  { \$set: { value: '$ROOT_URL', packageValue: '$ROOT_URL', valueSource: 'value' } },
  { upsert: true }
);

// Custom OAuth (ASPL)
db.rocketchat_settings.updateOne(
  { _id: 'Accounts_OAuth_Custom-Aspl' },
  { \$set: { value: true } },
  { upsert: true }
);

db.rocketchat_settings.updateOne(
  { _id: 'Accounts_OAuth_Custom-Aspl-url' },
  { \$set: { value: '$OAUTH_BACKEND_URL' } },
  { upsert: true }
);

// Ensure login service config uses local backend
db.meteor_accounts_loginServiceConfiguration.updateOne(
  { service: 'aspl' },
  { \$set: { serverURL: '$OAUTH_BACKEND_URL', custom: true } },
  { upsert: true }
);

print('Show_Setup_Wizard:', db.rocketchat_settings.findOne({ _id: 'Show_Setup_Wizard' }));
print('Site_Url:', db.rocketchat_settings.findOne({ _id: 'Site_Url' }));
print('Accounts_OAuth_Custom-Aspl-url:', db.rocketchat_settings.findOne({ _id: 'Accounts_OAuth_Custom-Aspl-url' }));
print('loginService(aspl):', db.meteor_accounts_loginServiceConfiguration.findOne({ service: 'aspl' }));
"

echo "Done."
