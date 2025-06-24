#!/bin/bash
cd /home/kavia/workspace/code-generation/civicsense-platform-349-d380cb41/citizen_authority_frontend_workspace/citizen_authority_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

