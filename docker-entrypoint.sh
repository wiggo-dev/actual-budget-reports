#!/bin/sh
set -eu

mkdir -p /data/actual-cache

# Named volumes are often root-owned; the app runs as `node` and must write
# SETTINGS_PATH / ACTUAL_DATA_DIR under /data.
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /data
  exec setpriv --reuid=node --regid=node --clear-groups -- "$@"
fi

exec "$@"
