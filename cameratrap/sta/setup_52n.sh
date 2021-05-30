#!/bin/bash

if test "$#" -ne 1; then
    echo "USAGE: $0 <auth_id>" 
    exit
fi

STA_URL="http://localhost:8080/sta/v1.1"
GPS_LON="2.044367"
GPS_LAT="41.485526"
AUTH_ID=$1

PROJECT_ID=`uuidgen`
THING_1_ID=`uuidgen`
THING_2_ID=`uuidgen`
CC0_ID=`uuidgen`
CC_BY_ID=`uuidgen`
CC_BY_NC_ID=`uuidgen`
CC_BY_NC_SA_ID=`uuidgen`
CC_BY_SA_ID=`uuidgen`
DS_1_ID=`uuidgen`
DS_2_ID=`uuidgen`
MDS_1_ID=`uuidgen`
DATE_TIME_NOW=`date -u +"%Y-%m-%dT%H:%M:%SZ"`

setup_file=STA_ds_setup.json


// TODO
// - create foi_sb_id
// - loop over creations
//   - create single datastreams
//   - create sensors
// - parse ids from response
// - share ids

echo "creating Party: $STA_URL/Parties('"$AUTH_ID"')"
cat $setup_file \
    | jq '.party' \
    | sed -E "s/AUTH_ID/$AUTH_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Parties

echo "creating Project: $STA_URL/Projects('"$PROJECT_ID"')"
cat $setup_file  \
    | jq '.project'
    | sed -E "s/PROJECT_ID/$PROJECT_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Projects

echo "creating Thing Raspberry: $STA_URL/Things('"$THING_1_ID"')"
cat $setup_file \
    | jq '.things.raspberry_pi' \
    | sed -E "s/1111/$GPS_LAT/g" \
    | sed -E "s/0000/$GPS_LON/g" \
    | sed -E "s/THING_1_ID/$THING_1_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Things

echo "creating Thing Env Board: $STA_URL/Things('"$THING_2_ID"')"
cat $setup_file \
    | jq '.things.env_board' \
    | sed -E "s/1111/$GPS_LAT/g" \
    | sed -E "s/0000/$GPS_LON/g" \
    | sed -E "s/THING_2_ID/$THING_2_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Things

echo "creating License CC0: $STA_URL/Licenses('"$CC0_ID"')"
cat $setup_file \
    | jq '.licenses.cc_zero' \
    | sed -E "s/CC0_ID/$CC0_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Licenses

echo "creating License CC BY: $STA_URL/Licenses('"$CC_BY_ID"')"
cat $setup_file \
    | jq '.licenses.cc_by' \
    | sed -E "s/CC_BY_ID/$CC_BY_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Licenses

echo "creating License CC BY-NC: $STA_URL/Licenses('"$CC_BY_NC_ID"')"
cat $setup_file \
    | jq '.licenses.cc_by_nc' \
    | sed -E "s/CC_BY_NC_ID/$CC_BY_NC_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Licenses

echo "creating License CC BY-NC-SA: $STA_URL/Licenses('"$CC_BY_NC_SA_ID"')"
cat $setup_file \
    | jq '.licenses.cc_by_nc_sa' \
    | sed -E "s/CC_BY_NC_SA_ID/$CC_BY_NC_SA_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Licenses

echo "creating License CC BY-SA: $STA_URL/Licenses('"$CC_BY_SA_ID"')"
cat $setup_file \
    | jq '.licenses.cc_by_sa' \
    | sed -E "s/CC_BY_SA_ID/$CC_BY_SA_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Licenses

echo "creating Datastream Photo: $STA_URL/Datastreams('"$DS_1_ID"')"
cat $setup_file \
    | jq '.datastreams.photo' \
    | sed -E "s/DS_1_ID/$DS_1_ID/g" \
    | sed -E "s/CC_BY_ID/$CC_BY_ID/g" \
    | sed -E "s/AUTH_ID/$AUTH_ID/g" \
    | sed -E "s/THING_1_ID/$THING_1_ID/g" \
    | sed -E "s/PROJECT_ID/$PROJECT_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Datastreams

echo "creating Datastream Detection: $STA_URL/Datastreams('"$DS_2_ID"')"
cat $setup_file \
    | jq '.datastreams.detection' \
    | sed -E "s/DS_2_ID/$DS_2_ID/g" \
    | sed -E "s/CC_BY_NC_ID/$CC_BY_NC_ID/g" \
    | sed -E "s/AUTH_ID/$AUTH_ID/g" \
    | sed -E "s/THING_1_ID/$THING_1_ID/g" \
    | sed -E "s/PROJECT_ID/$PROJECT_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/Datastreams

echo "creating MultiDatastream Environment: $STA_URL/MultiDatastreams('"$MDS_1_ID"')"
cat $setup_file \
    | jq '.multi_datastreams.env' \
    | sed -E "s/1111/$GPS_LAT/g" \
    | sed -E "s/0000/$GPS_LON/g" \
    | sed -E "s/MDS_1_ID/$MDS_1_ID/g" \
    | sed -E "s/CC_BY_NC_ID/$CC_BY_NC_ID/g" \
    | sed -E "s/AUTH_ID/$AUTH_ID/g" \
    | sed -E "s/THING_2_ID/$THING_2_ID/g" \
    | sed -E "s/PROJECT_ID/$PROJECT_ID/g" \
    | curl -H "Content-Type: application/json" -X POST --data-binary @- $STA_URL/MultiDatastreams

