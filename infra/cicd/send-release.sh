#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_BUCKET:?Production DEPLOY_BUCKET variable is required}"
: "${DEPLOY_INSTANCE_ID:?Production DEPLOY_INSTANCE_ID variable is required}"
: "${RELEASE_ID:?Release identifier is required}"
checksum=$(sha256sum release.tar.gz | cut -d ' ' -f 1)
aws s3 cp release.tar.gz "s3://$DEPLOY_BUCKET/github-releases/$RELEASE_ID/release.tar.gz" --sse AES256 --only-show-errors
export RELEASE_CHECKSUM=$checksum
python3 - <<'PY'
import json
import os
from pathlib import Path
Path('ssm-parameters.json').write_text(json.dumps({
    'ReleaseId': [os.environ['RELEASE_ID']],
    'Checksum': [os.environ['RELEASE_CHECKSUM']],
}))
PY
command_id=$(aws ssm send-command \
  --instance-ids "$DEPLOY_INSTANCE_ID" --document-name Nextou-DeployRelease \
  --parameters file://ssm-parameters.json \
  --timeout-seconds 600 --comment "GitHub release $RELEASE_ID" \
  --query Command.CommandId --output text)
printf 'Systems Manager deployment command: %s\n' "$command_id"
# The stock CLI waiter gives up after 100 seconds; image loading can take longer.
for attempt in $(seq 1 120); do
  if aws ssm get-command-invocation --command-id "$command_id" \
    --instance-id "$DEPLOY_INSTANCE_ID" > invocation.json 2> invocation-error.txt; then
    status=$(python3 -c 'import json; print(json.load(open("invocation.json"))["Status"])')
    case "$status" in
      Pending|InProgress|Delayed|Cancelling) ;;
      *)
        python3 - <<'PY'
import json
data = json.load(open('invocation.json'))
print(data.get('StandardOutputContent', ''))
print(data.get('StandardErrorContent', ''))
print('Deployment status:', data['Status'])
PY
        test "$status" = Success
        exit
        ;;
    esac
  elif ! grep -q InvocationDoesNotExist invocation-error.txt; then
    cat invocation-error.txt >&2
    exit 1
  fi
  sleep 10
done
echo "Deployment command $command_id exceeded the polling deadline; inspect Systems Manager before retrying." >&2
exit 1
