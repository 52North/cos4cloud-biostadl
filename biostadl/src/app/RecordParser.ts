import STA from "../sta/sta_service";
import { Location, createRef } from "../sta/staTypes";
import { staBaseUrl } from "../config/Config";
import { EMPTY_UOM, NATUSFERA_BASE_URL, STA_ID } from "../config/Constants";
import DataLoader from "./CSVReader";
import { Record, CitSciObservation, CitScientist, CitSciProject } from "./record_types";
import { OM_TYPE } from "../sta/citSciTypes";
import { FeatureOfInterest, HistoricalLocation, NamedValue, Observation } from "../sta/staTypes";
import CitSciDataProvider from "./CitSciIEDataProvider";

export default class RecordParser {

    parseRecords(data: any[]): Record[] {
        if (!data) {
            return [];
        }

        const records = data.map((row: any) => {
            return {
                id: row.id,
                user: createUser(row),
                feature: RecordParser.createFeature(row),
                observations: createObservations(row),
                resultTime: row.created_at_utc,
                project: createProject(row),
                url: row.uri
            };
        });

        // remove invalid records
        return removeDuplicates(records.filter((record: Record) => record.feature.feature));
    }

    static createFeature(row: any): FeatureOfInterest {
        return {
            [STA_ID]: `feature_${row.id}`,
            name: "Observed Location",
            description: `Insitu location of record ${row.id}`,
            encodingType: "application/vnd.geo+json",
            feature: createPoint(row)
        };
    }

    static createHistoricalLocation(record: Record, thingId?: string): HistoricalLocation {
        const feature = record.feature;
        const location = createLocation(feature.feature);
        const time = record.resultTime;
        const histLoc: HistoricalLocation = {
            time,
            Locations: [location],
            Thing: createRef(thingId)
        };

        return histLoc;
    }
}

function createLocation(geometry: any): Location {
    return {
        name: "observed location",
        description: "The location where the observation has been made (insitu for now)",
        encodingType: "application/vnd.geo+json",
        location: geometry
    }
}

function createPoint(row: any): any {
    let lon = parseFloat(row.longitude);
    let lat = parseFloat(row.latitude);
    if (isNaN(lon) || isNaN(lat)) {
        return undefined;
    }
    return {
        type: "Point",
        coordinates: [lon, lat]
    }
}

function createUser(row: any): CitScientist {
    return {
        id: row.user_id,
        url: NATUSFERA_BASE_URL + "/users/" + row.user_id,
        name: row.user_login
    };
}

function createObservations(row: any): CitSciObservation[] {
    return [
        createTaxonObservation(row),
        ...createPhotoObservations(row)
    ];
}

function createTaxonObservation(row: any): CitSciObservation {
    return {
        name: "taxon",
        type: OM_TYPE.OM_TYPE_TAXON,
        result: row.species_guess,
        parameters: [
            // TODO own observations?!
            {
                name: "taxon_name",
                value: row.taxon_name
            },
            {
                name: "fenofase",
                value: row.Fenofase
            }
        ]
    }
}

function createPhotoObservations(row: any): CitSciObservation[] {
    const observations: CitSciObservation[] = [];
    for (let i = 0; i < row.observation_photos_count; i++) {
        observations.push({
            name: `photo_${i}`,
            parameters: createPhotoParameters(row, i),
            result: row[`photo_large_url_${i}`],
            type: OM_TYPE.OM_TYPE_PHOTO,
        });
    }
    return observations;
}

function createPhotoParameters(row: any, index: number): NamedValue[] {
    const parameters: NamedValue[] = [];
    const addIfPresent = function (key: string, value: string) {
        if (value) {
            parameters.push({
                name: key,
                value
            });
        }
    }
    addIfPresent("attribution", row[`photo_attribution_${index}`]);
    return parameters;
}

function removeDuplicates(records: Record[]) {
    if (!records || records.length === 0) {
        return records;
    }

    records.forEach((elem: Record, index: number, self: Record[]) => {
        const current = elem;
        const currentIdx = index;
        const duplicate = self.find((record, i) => record.id === current.id && currentIdx !== i);
        if (duplicate) {
            self.splice(self.indexOf(duplicate), 1);
        }
    });
    return records;
}

function createProject(row: any): CitSciProject {
    return {
        id: row.project_id_0,
        title: row.project_title_0
    }
}

