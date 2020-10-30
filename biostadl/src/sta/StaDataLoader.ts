
import STA from "./sta_service";

import { EMPTY_UOM, NATUSFERA_BASE_URL, STA_ID } from "../config/Constants";
import { CitSciObservation, CitSciProject, ParsedRecord } from "../app/record_types";
import RecordParser from "../app/RecordParser";
import {
    createRef,
    ObservedProperty,
    Sensor,
    Thing,
    License,
    ObservationGroup,
    OM_TYPE,
    PHOTO_DEFINITION,
    TAXON_DEFINITION,
    Project, Party,
    DataStream,
    OM_TYPE_CATEGORY,
    Observation
} from "./staTypes";

const getUuid = require('uuid-by-string');

type ObservationComposite = {
    readonly thingPending: Promise<Thing>;
    readonly partyPending: Promise<Party>;
    readonly records: ParsedRecord[];
}

export class StaDataLoader {

    sta: STA;

    constructor(sta: STA) {
        this.sta = sta;
    }

    load(data: { projects: CitSciProject[], records: ParsedRecord[] }) {
        const records = data.records;
        Promise.all([
            addSensors(this.sta),
            addLicenses(this.sta),
            addObservedProperties(this.sta),
            gracefullyResolve(addFeatures(this.sta, records))
        ]).then(async (result: any[]) => {
            const composites = await addThings(this.sta, records);
            composites.forEach(c => {
                if (!c) composites.delete(c);
            })

            const jobs: Promise<any>[] = [];
            records.forEach(record => {
                jobs.push(gracefullyResolve(this.sta.postGroup({
                    "@iot.id": `composite_group_${record.id}`,
                    name: `Observation composition ${record.id}`,
                    description: "Composite group of a citizen science observation",
                    ObservationRelations: [],
                    properties: {
                        type: "topLevel"
                    },
                } as ObservationGroup)))
            });

            Promise.all(jobs).then(() => {
                addDatastreams(this.sta, {
                    data,
                    sensors: result[0],
                    license: result[1],
                    observedProperties: result[2],
                    composites
                });

            });

            // TODO add verification streams and comments streams

        });
    }
}

async function addLicenses(sta: STA) {

    const licenses: License[] = [
        {
            [STA_ID]: "CC_BY-SA",
            name: "Attribution-ShareAlike",
            definition: "https://creativecommons.org/licenses/by-sa/4.0",
            logo: "https://licensebuttons.net/l/by-sa/3.0/88x31.png",
            Datastreams: []
        },
        {
            [STA_ID]: "CC_BY-ND",
            name: "Attribution-NoDerivs",
            definition: "https://creativecommons.org/licenses/by-nd/4.0",
            logo: "https://licensebuttons.net/l/by-nd/3.0/88x31.png",
            Datastreams: []
        },
        {
            [STA_ID]: "CC_BY-NC",
            name: "Attribution-NonCommercial",
            definition: "https://creativecommons.org/licenses/by-nc/4.0",
            logo: "https://licensebuttons.net/l/by-nc/3.0/88x31.png",
            Datastreams: []
        },
        {
            [STA_ID]: "CC_BY-NC-SA",
            name: "Attribution-NonCommercial-ShareAlike",
            definition: "https://creativecommons.org/licenses/by-nc-sa/4.0",
            logo: "https://licensebuttons.net/l/by-nc-sa/3.0/88x31.png",
            Datastreams: []
        },
        {
            [STA_ID]: "CC_BY-NC-ND",
            name: "Attribution-NonCommercial-NoDerivs",
            definition: "https://creativecommons.org/licenses/by-nc-nd/4.0",
            logo: "https://licensebuttons.net/l/by-nc-nd/3.0/88x31.png",
            Datastreams: []
        },
        {
            [STA_ID]: "CC_BY",
            name: "Attribution",
            definition: "https://creativecommons.org/licenses/by/4.0",
            logo: "https://licensebuttons.net/l/by/3.0/88x31.png",
            Datastreams: []
        },
        {
            [STA_ID]: "MIT_LICENSE",
            name: "MIT License",
            definition: "https://opensource.org/licenses/MIT",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.sßvg/220px-MIT_logo.svg.png",
            Datastreams: []
        }
    ];

    const response = await sta.getLicenses();
    return Promise.all(licenses
        .filter(license => !hasEntityWithId(response.body, license["@iot.id"]))
        .map(async license => (await sta.postLicense(license)).body));
}

async function addSensors(sta: STA) {
    return sta.getSensors().then(response => {
        const sensors = response.body;

        const processes: Sensor[] = [{
            [STA_ID]: "citizen_observation",
            name: "Citizen Observation",
            description: "Observation process of a person (citizen scientist) sharing individual observations to the public for scientific use",
            encodingType: "application/pdf",
            metadata: "https://www.weobserve.eu/cops-glossary/#6af6a6f33a552b418"
        }, {
            [STA_ID]: "biodiversity_expert",
            name: "Biodiversity Expert",
            description: "Verification process of an expert person in the field of biodiversity",
            encodingType: "application/pdf",
            metadata: "https://www.weobserve.eu/cops-glossary/#6af6a6f33a552b418"
        }];

        return Promise.all(processes.filter(sensor => !hasEntityWithId(sensors, sensor["@iot.id"]))
            .map(sensor => sta.postSensor(sensor).then(r => r?.body)));
    });
}

async function addObservedProperties(sta: STA) {
    const jobs: Promise<ObservedProperty>[] = [];
    sta.getObservedProperties().then(response => {
        const obsProps = response.body;

        if (!hasEntityWithId(obsProps, "taxon")) {
            jobs.push(sta.postObservedProperty({
                [STA_ID]: "taxon",
                name: "taxon",
                description: "The canonical name of the observed species",
                definition: "http://purl.org/biodiversity/taxon/"
            } as ObservedProperty));
        }

        if (!hasEntityWithId(obsProps, "photo")) {
            jobs.push(sta.postObservedProperty({
                [STA_ID]: "photo",
                name: "photo",
                description: "A photo of the observed species",
                definition: "http://purl.org/net/photo"
            } as ObservedProperty));
        }
    });

    return Promise.all(jobs);
}

async function addFeatures(sta: STA, records: ParsedRecord[]) {
    return sta.getFeatures().then(async response => {
        const features = response.body;
        // each record => observed feature
        return Promise.all(records.map(record => record.feature)
            .filter(feature => !hasEntityWithId(features, feature["@iot.id"]))
            .map(feature => gracefullyResolve(sta.postFeature(feature))));
    });
}

async function addThings(sta: STA, records: ParsedRecord[]) {
    const composites: Map<string, ObservationComposite> = new Map();
    await Promise.all(records.map(async record => {
        const user = record.user;
        const userId = user.id;
        if (!composites.has(userId)) {
            const histLoc = RecordParser.createHistoricalLocation(record);
            const thing = gracefullyResolve(sta.postThing({
                "@iot.id": `device_${user.id}`,
                name: user.name,
                description: `Mobile Phone of user ${user.id}`,
                properties: {
                    uri: user.url
                },
                HistoricalLocations: [histLoc]
            } as Thing));

            const party = gracefullyResolve(sta.postParty({
                [STA_ID]: userId,
                nickName: user.name,
                authId: getUuid(userId),
                role: "individual",
                Datastreams: []
            } as Party));

            composites.set(userId, {
                // TODO promise handling
                thingPending: thing.then(r => r?.body),
                partyPending: party.then(r => r?.body),
                records: [record]
            });
        } else {
            const twr = composites.get(userId)
            return twr?.thingPending.then(thing => {
                twr.records.push(record);
                const id = thing["@iot.id"];
                const histLoc = RecordParser.createHistoricalLocation(record, id);
                return gracefullyResolve(sta.postHistoricalLocation(histLoc));
            }).catch(error => {
                console.error(`invalid thing: ${error} with user ${userId}`);
                composites.delete(userId);
                return;
            });
        }
    }));
    return composites;
}

async function addDatastreams(sta: STA, state: any) {
    const { projects } = state.data as { projects: CitSciProject[] };

    const licenses = state.licenses as License[];
    const sensors = await state.sensors as Sensor[];
    const composites = state.composites as Map<string, ObservationComposite>;
    const staProjects = await updateProjects(sta, projects);

    const jobs: Promise<any>[] = [];
    const sensorId = sensors[0]["@iot.id"];
    composites.forEach(async (composite) => {

        const thing = (await composite.thingPending);
        const party = (await composite.partyPending);
        if (thing && party) {
            const thingId = thing["@iot.id"];
            const partyId = party["@iot.id"];

            const projectId = staProjects[0]["@iot.id"];

            const records = composite.records;
            jobs.push(gracefullyResolve(sta.postDatastream({
                name: "A datastream of taxons",
                Thing: createRef(thingId),
                Party: createRef(partyId),
                Sensor: createRef(sensorId),
                ObservedProperty: createRef("taxon"),
                observationType: OM_TYPE_CATEGORY,
                unitOfMeasurement: EMPTY_UOM,
                description: `Taxon Datastream for user ${party.nickname}`,
                Observations: createObservations(records, o => o.type === TAXON_DEFINITION),
                Project: createRef(projectId)
            } as DataStream)));

            const photoObservations = filterObservations(records, o=> o.type === PHOTO_DEFINITION);

            // categorize observations along licenses
            const licensedObservations = new Map<string, CitSciObservation[]>();
            photoObservations.forEach(o => {
                const guess = o.licenseGuess?.license;
                if (!guess || guess.match(/unknown/)) {
                    return;
                }
                if (!licensedObservations.has(guess)) {
                    licensedObservations.set(guess, []);
                }
                licensedObservations.get(guess)!.push(o);
            });
            
            licensedObservations.forEach((observations, licenseId) => {
                jobs.push(gracefullyResolve(sta.postDatastream({
                    name: "A datastream of photos",
                    Thing: createRef(thingId),
                    Party: createRef(partyId),
                    Sensor: createRef(sensorId),
                    ObservedProperty: createRef("photo"),
                    observationType: OM_TYPE_CATEGORY,
                    unitOfMeasurement: EMPTY_UOM,
                    description: `Photo Datastream for user ${party.nickname}`,
                    Observations: mapToObservations(observations),
                    License: createRef(licenseId !== "unknown" ? licenseId : undefined),
                    Project: createRef(projectId),
                } as DataStream)));
            });
        }
    });

    return Promise.all(jobs);
}

async function updateProjects(sta: STA, projects: CitSciProject[]) {
    return sta.getProjects().then(async response => {
        const knownProjects: Project[] = response.body.value;
        const addedProjects: Project[] = await Promise.all(projects
            .filter(project => !hasEntityWithId(knownProjects, project.id))
            .map(project => gracefullyResolve(sta.postProject({
                "@iot.id": project.id,
                name: project.title,
                description: "This is a demo project",
                runtime: "2020-06-25T03:42:02-02:00",
                classification: "NA",
                url: `${NATUSFERA_BASE_URL}/projects/${project.id}`,
                termsOfUse: "https://example.org/terms",
                privacyPolicy: "https://exmaple.org/privacy",
                Datastreams: []
            }).then(r => r.body))));
        knownProjects.push(...addedProjects);
        return knownProjects;
    });
}

function filterObservations(records: ParsedRecord[],
    predicate: (value: CitSciObservation) => boolean): CitSciObservation[] {
    
    const observations: CitSciObservation[] = [];
    records.forEach(record => {
        const citSciObservations = record.observations;
        observations.push(...citSciObservations.filter(predicate));
    });
    return observations;
}

function createObservations(records: ParsedRecord[], predicate?: (value: CitSciObservation) => boolean): Observation[] {
    if (!records) {
        return [];
    }

    const observations: Observation[] = [];
    records.forEach(record => {
        const citSciObservations = record.observations;
        const filteredObservations = predicate ? citSciObservations.filter(predicate) : citSciObservations;
        const mappedObservations = mapToObservations(filteredObservations);
        observations.push(...mappedObservations);
    });

    return observations;
}

function mapToObservations(observations: CitSciObservation[]): Observation[] {
    return observations.map((value, index) => {
        const resultTime = new Date(value.resultTime);
        // get unique composite key for each entity
        const phenomenonTime = new Date(resultTime.getMilliseconds() + index);
        return {
            // ["@iot.id"]: record.id + "_" + o.name,
            FeatureOfInterest: createRef(value.featureId),
            resultTime: resultTime.toISOString(),
            phenomenonTime: phenomenonTime.toISOString(),
            result: value.result,
            parameters: value.parameters,
            resultQuality: value.resultQuality || "NA",
            ObservationRelations: [{
                "@iot.id": "CompositeRelation_" + value.recordId + "_" + value.name,
                type: "root",
                name: "Composite relation",
                description: "Composite relation",
                Group: createRef(`composite_group_${value.recordId}`)
            }]
        } as Observation;
    });
}

function hasEntityWithId(response: any, id: string | undefined) {
    const elements = response?.value;
    if (!(elements || Array.isArray(elements))) {
        return false;
    }

    return id && elements.find((e: any) => e[STA_ID] === id);
}

async function gracefullyResolve(promise: Promise<any>): Promise<any> {
    return Promise.resolve(promise).catch(error => {
        console.error(`Could not resolve: ${error}`);
    });
}
