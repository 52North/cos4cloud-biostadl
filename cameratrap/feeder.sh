#!/bin/bash

if test "$#" -ne 1 ; then
    echo "USAGE: $0 <vtt-file>" 
    exit
fi

file=$1
dir_name=$(dirname $file)

sta_url="http://localhost:8080/FROST-Server.HTTP/v1.1"

# set the foi ids
foi_cam_id="foi_cam_id"
foi_sb_id="foi_sb_id"
# set the datastream ids
ds_imagery_id="ds_cam_imagery_id"
ds_taxon_id="ds_cam_taxon_id"
ds_sb_temp_id="ds_sb_temp_id"
ds_sb_pressure_id="ds_sb_pressure_id"
ds_sb_relhum_id="ds_sb_relhum_id"
ds_sb_lum_id="ds_sb_lum_id"

## TODO parse data from file name
date=$(echo $file | cut -d '_' -f 1 | tr -d $dir_name | tr -d "/" )
# parse time
time=$(sed '/^$/d' $file | cut -d '@' -f 2 -s)
datetime="$date"'T'"$time"
echo $datetime

# parse sensorboard data
data=($(sed '/^$/d' $file | tail -n 1 | awk '{ print $2; print $5; print $8; print $11}'))
temperature=${data[0]}
relative_humidity=${data[1]}
luminance=${data[2]}
pressure=${data[3]}

# TODO
species_guess="TODO"

trap_event_data=$(cat -s << EOF
{
    "name": "composite observation",
    "description": "Demo Group 1 description",
    "Relations": [
        {
            "subject": {
                "result": "http://localhost:8081/v1.1/files/52n_logo-main.png",
                "phenomenonTime": "$datetime",
                "Datastream": {
                    "@iot.id": "$ds_cam_imagery_id"
                },
                "FeatureOfInterest": {
                    "@iot.id": "$foi_cam_id"
                }
            },
            "role": "root",
            "namespace": "https://some-ontology.org/#identifiedBy",
            "object": {
                "result": "$datetime",
                "phenomenonTime": "$species_guess",
                "Datastream": {
                    "@iot.id": "$ds_cam_taxon_id"
                },
                "FeatureOfInterest": {
                    "@iot.id": "$foi_cam_id"
                }
            }
        }
    ],
    "Observations": [
        {
            "result": "$temperature",
            "phenomenonTime": "$datetime",
            "Datastream": {
                "@iot.id": "ds_sb_temp_id"
            },
            "FeatureOfInterest": {
                "@iot.id": "$foi_sb_id"
            }
        },
        {
            "result": "$pressure",
            "phenomenonTime": "$datetime",
            "Datastream": {
                "@iot.id": "$ds_sb_pressure_id"
            },
            "FeatureOfInterest": {
                "@iot.id": "$foi_sb_id"
            }
        },
        {
            "result": "$relative_humidity",
            "phenomenonTime": "$datetime",
            "Datastream": {
                "@iot.id": "ds_sb_relhum_id"
            },
            "FeatureOfInterest": {
                "@iot.id": "$foi_sb_id"
            }
        },
        {
            "result": "$luminance",
            "phenomenonTime": "$datetime",
            "Datastream": {
                "@iot.id": "ds_sb_lum_id"
            },
            "FeatureOfInterest": {
                "@iot.id": "$foi_sb_id"
            }
        }
    ]
}
EOF
)

echo $trap_event_data

# echo "feed observation data... "
# curl -H "Content-Type: application/json" \
    # -X POST --data "$trap_event_data" $sta_url/Groups

curl -s -H "Content-Type: application/json" \
    -X POST --data "$trap_event_data" $sta_url/Groups