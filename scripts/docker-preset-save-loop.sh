#!/usr/bin/env bash
# Feedback loop: save-preset path against the published GHCR image.
# Asserts PUT /api/settings persists a new preset across GET.
# Exit 0 = green (save works). Exit 1 = red (user symptom).
set -euo pipefail

IMAGE="${IMAGE:-ghcr.io/wiggo-dev/actual-budget-reports:release}"
NAME="abr-preset-loop-$$"
VOL="abr-preset-loop-vol-$$"
PORT="${PORT:-18080}"

cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker volume rm -f "$VOL" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker volume create "$VOL" >/dev/null

# Optional: preseed a root-owned settings file (common after first root write)
if [[ "${PRESEED_ROOT_SETTINGS:-0}" == "1" ]]; then
  docker run --rm -v "$VOL:/data" -u 0 busybox sh -c \
    'echo "{\"presets\":[{\"id\":\"all-accounts\",\"name\":\"All accounts\",\"excludedAccountIds\":[]}],\"reportSelections\":{},\"selectedPresetId\":\"all-accounts\"}" > /data/settings.json && chown root:root /data/settings.json && chmod 644 /data/settings.json && ls -la /data'
fi

docker run -d --name "$NAME" \
  -p "$PORT:3000" \
  -v "$VOL:/data" \
  -e ACTUAL_SERVER_URL="${ACTUAL_SERVER_URL:-http://127.0.0.1:9}" \
  -e ACTUAL_SERVER_PASSWORD="${ACTUAL_SERVER_PASSWORD:-x}" \
  -e ACTUAL_SYNC_ID="${ACTUAL_SYNC_ID:-x}" \
  "$IMAGE" >/dev/null

# Wait for HTTP
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    break
  fi
  sleep 0.5
done

echo "== container whoami / data =="
docker exec "$NAME" sh -c 'id; ls -la /data; echo SETTINGS_PATH=$SETTINGS_PATH'

echo "== GET settings =="
BEFORE=$(curl -sf "http://127.0.0.1:$PORT/api/settings")
echo "$BEFORE" | head -c 400; echo

PAYLOAD=$(node -e '
const before = JSON.parse(process.argv[1]).data;
const preset = {
  id: "loop-preset-1",
  name: "Loop Preset",
  excludedAccountIds: ["acc-a"],
};
const next = {
  ...before,
  presets: [...before.presets.filter(p => p.id !== preset.id), preset],
  selectedPresetId: preset.id,
  reportSelections: {
    ...before.reportSelections,
    dashboard: { excludedAccountIds: preset.excludedAccountIds },
  },
};
process.stdout.write(JSON.stringify(next));
' "$BEFORE")

echo "== PUT settings =="
PUT_STATUS=$(curl -s -o /tmp/abr-put-body.json -w "%{http_code}" \
  -X PUT "http://127.0.0.1:$PORT/api/settings" \
  -H "content-type: application/json" \
  -d "$PAYLOAD")
echo "status=$PUT_STATUS"
head -c 400 /tmp/abr-put-body.json; echo

echo "== GET settings after =="
AFTER=$(curl -sf "http://127.0.0.1:$PORT/api/settings")
echo "$AFTER" | head -c 400; echo

echo "== volume contents =="
docker run --rm -v "$VOL:/data" busybox ls -la /data

if [[ "$PUT_STATUS" != "200" ]]; then
  echo "LOOP_RED: PUT failed ($PUT_STATUS)"
  exit 1
fi

node -e '
const after = JSON.parse(process.argv[1]).data;
const found = after.presets.find(p => p.id === "loop-preset-1");
if (!found) {
  console.log("LOOP_RED: preset missing after PUT");
  process.exit(1);
}
if (found.name !== "Loop Preset") {
  console.log("LOOP_RED: preset name mismatch");
  process.exit(1);
}
console.log("LOOP_GREEN: preset persisted");
' "$AFTER"
