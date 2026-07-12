#!/bin/bash
set -e

: "${MONGO_URI:?MONGO_URI must be set}"
: "${NODEBB_URL:?NODEBB_URL must be set}"
: "${NODEBB_SECRET:?NODEBB_SECRET must be set}"

mkdir -p /opt/config
node <<'NODE'
const fs = require('fs');
const config = {
  url: process.env.NODEBB_URL,
  secret: process.env.NODEBB_SECRET,
  database: 'mongo',
  mongo: { uri: process.env.MONGO_URI },
  port: process.env.PORT || '10000',
};
fs.writeFileSync('/opt/config/config.json', JSON.stringify(config, null, 2));
NODE

exec /usr/local/bin/entrypoint.sh
