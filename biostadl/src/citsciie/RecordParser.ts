import STA from "../sta/sta_service";
import { Location, createRef, TAXON_DEFINITION, PHOTO_DEFINITION } from "../sta/staTypes";
import { NATUSFERA_BASE_URL, STA_ID } from "../common/Constants";
import { ParsedRecord, CitSciObservation, CitScientist, CitSciProject } from "./record_types";
import { FeatureOfInterest, HistoricalLocation, NamedValue } from "../sta/staTypes";

export default class RecordParser {

    parseRecords(data: any[]): { projects: CitSciProject[]; records: ParsedRecord[]; } {
        if (!data) {
            return { projects: [], records: [] };
        }

        const allProjects: Record<string, CitSciProject> = {};
        const records = data.map((row: any) => {
            const projects = createProjects(row);
            Object.keys(projects).forEach(id => allProjects[id] = projects[id]);
            const recordId = row.id;
            const feature = RecordParser.createFeature(row);
            return {
                id: recordId,
                user: createUser(row),
                projects: Object.values(projects),
                observations: createObservations(recordId, feature["@iot.id"]!, row),
                resultTime: row.created_at_utc,
                url: row.uri,
                feature      
            };
        });

        return {
            projects: Object.values(allProjects),
            // remove invalid records
            records: removeDuplicates(records.filter((record: ParsedRecord) => record.feature.feature))
        };
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

    static createHistoricalLocation(record: ParsedRecord, thingId?: string): HistoricalLocation {
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

function createObservations(recordId: string, featureId: string, row: any): CitSciObservation[] {
    const observations = [];
    if (row.species_guess) {
        observations.push(createTaxonObservation(recordId, featureId, row));
    }
    if (row.observation_photos_count > 0) {
        observations.push(...createPhotoObservations(recordId, featureId, row));
    }
    return observations;
}

function createTaxonObservation(recordId: string, featureId: string, row: any): CitSciObservation {
    return {
        recordId,
        featureId,
        name: "taxon",
        type: TAXON_DEFINITION,
        result: row.species_guess,
        resultTime: row.created_at_utc,
        parameters: {
            // TODO own observations?!
            "taxon_name": row.taxon_name,
            "fenofase": row.Fenofase
        }
    }
}

function createPhotoObservations(recordId: string, featureId: string, row: any): CitSciObservation[] {
    const observations: CitSciObservation[] = [];
    for (let i = 0; i < row.observation_photos_count; i++) {
        const attributionString = row[`photo_attribution_${i}`];
        const licenseGuess = parseLicense(attributionString);
        observations.push({
            recordId,
            featureId,
            name: `photo_${i}`,
            resultTime: row.created_at_utc,
            parameters: createPhotoParameters(row, i),
            result: row[`photo_large_url_${i}`],
            type: PHOTO_DEFINITION,
            licenseGuess
        });
    }
    return observations;
}

function createPhotoParameters(row: any, index: number): any {
    const parameters : any = {};
    const addIfPresent = function (key: string, value: string) {
        if (value) {
            parameters[key] = value;
        }
    }

    // TODO add parameters
    return parameters;
}

function parseLicense(attribution?: string): {license: string, attribution?: string} {
    let license = "unknown;"
    if (attribution?.match(/^.*\(CC BY-SA\).*$/)) {
        license = "CC_BY-SA";
    } else if (attribution?.match(/^.*\(CC BY-ND\).*$/)) {
        license = "CC_BY-ND";
    } else if (attribution?.match(/^.*\(CC BY-NC\).*$/)) {
        license = "CC_BY-NC";
    } else if (attribution?.match(/^.*\(CC BY-NC-SA\).*$/)) {
        license = "CC_BY-NC-SA";
    } else if (attribution?.match(/^.*\(CC BY-NC-ND\).*$/)) {
        license = "CC_BY-NC-ND";
    } else if (attribution?.match(/^.*\(CC BY\).*$/)) {
        license = "CC_BY";
    }
        
    return {
        license,
        attribution: attribution
    };
}

function removeDuplicates(records: ParsedRecord[]) {
    if (!records || records.length === 0) {
        return records;
    }

    records.forEach((elem: ParsedRecord, index: number, self: ParsedRecord[]) => {
        const current = elem;
        const currentIdx = index;
        const duplicate = self.find((record, i) => record.id === current.id && currentIdx !== i);
        if (duplicate) {
            self.splice(self.indexOf(duplicate), 1);
        }
    });
    return records;
}

function createProjects(row: any): Record<string, CitSciProject> {
    const project_postfixes = [0, 1, 2, 3];
    const projects: Record<string, CitSciProject> = {};
    project_postfixes.forEach(postfix => {
        const projectId = row[`project_id_${postfix}`];
        if (projectId) {
            projects[projectId] = {
                id: projectId,
                title: row[`project_title_${postfix}`]
            };
        }
    });
    return projects;
}

