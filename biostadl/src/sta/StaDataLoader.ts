
import STA from "./sta_service";

import { EMPTY_UOM, STA_ID } from "../config/Constants";
import { Record } from "../app/record_types";
import { createRef, Observation, ObservedProperty, Sensor, Thing } from "./staTypes";
import RecordParser from "../app/RecordParser";
import { License, ObservationGroup, OM_TYPE, PHOTO_DEFINITION, TAXON_DEFINITION, Project, Party, CitSciDataStream, OM_TYPE_CATEGORY } from "./citSciTypes";

type ObservationComposite = {
    readonly thingPending: Promise<Thing>;
    readonly partyPending: Promise<Party>;
    readonly records: Record[];
}

export class StaDataLoader {

    sta: STA;

    constructor(sta: STA) {
        this.sta = sta;
    }

    load(records: Record[]) {

        Promise.all([
            addLicense(this.sta).then(r => r.body),
            addSensor(this.sta).then(r => r?.body),
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
                    "@iot.id": "group_" + record.id,
                    name: "Observation composition " + record.id,
                    description: "Composite group of a citizen science observation",
                    ObservationRelations: [],
                    properties: {
                        type: "topLevel"
                    },
                } as ObservationGroup)))
            });

            const allRecords = records;
            Promise.all(jobs).then(() => {
                addDatastreams(this.sta, {
                    allRecords,
                    license: result[0],
                    sensor: result[1],
                    observedProperties: result[2],
                    composites
                });

            })

        });
    }
}

async function addLicense(sta: STA) {
    return sta.getLicenses().then(response => {
        const licenses = response.body;
        const licId = "MIT_LICENSE";
        if (!hasElement(licenses, licId)) {
            return sta.postLicense({
                [STA_ID]: licId,
                name: "MIT License",
                definition: "https://opensource.org/licenses/MIT",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.sßvg/220px-MIT_logo.svg.png",
                Datastreams: []
            } as License);
        }
    });
}

async function addSensor(sta: STA) {
    return sta.getSensors().then(response => {
        const sensors = response.body;
        const sensorId = "citizen_observation";
        if (!hasElement(sensors, sensorId))
            return sta.postSensor({
                [STA_ID]: sensorId,
                name: "Citizen Observation",
                description: "Observation process of a person sharing individual observations to the public for scientific use",
                encodingType: "application/pdf",
                metadata: "https://www.weobserve.eu/cops-glossary/#6af6a6f33a552b418"
            } as Sensor);
    });
}

async function addObservedProperties(sta: STA) {
    const jobs: Promise<ObservedProperty>[] = [];
    sta.getObservedProperties().then(response => {
        const obsProps = response.body;

        if (!hasElement(obsProps, "taxon")) {
            jobs.push(sta.postObservedProperty({
                [STA_ID]: "taxon",
                name: "taxon",
                description: "The canonical name of the observed species",
                definition: "http://purl.org/biodiversity/taxon/"
            } as ObservedProperty));
        }

        if (!hasElement(obsProps, "photo")) {
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

async function addFeatures(sta: STA, records: Record[]) {
    return sta.getFeatures().then(async response => {
        const features = response.body;
        // each record => observed feature
        return Promise.all(records.map(record => record.feature)
            .filter(feature => !hasElement(features, feature["@iot.id"]))
            .map(feature => gracefullyResolve(sta.postFeature(feature))));
    });
}

async function addThings(sta: STA, records: Record[]) {
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
    const allRecords = state.allRecords as Record[];
    const composites = state.composites as Map<string, ObservationComposite>;
    const license = state.license as License;
    const sensor = await state.sensor as Sensor;

    const jobs: Promise<any>[] = [];
    addProjects(sta, allRecords).then((projectIds: string[]) => {
        projectIds.forEach((projectId: string) => {
            const sensorId = sensor["@iot.id"];
            composites.forEach(async (composite) => {

                const thing = (await composite.thingPending);
                const party = (await composite.partyPending);
                if (thing && party) {
                    const thingId = thing["@iot.id"];
                    const partyId = party["@iot.id"];
                    const licenseId = license["@iot.id"];

                    const projectRecords = composite.records.filter(r => r.project.id === projectId)
                    jobs.push(gracefullyResolve(sta.postDatastream({
                        name: "A datastream of taxons",
                        Thing: createRef(thingId),
                        Party: createRef(partyId),
                        Sensor: createRef(sensorId),
                        ObservedProperty: createRef("taxon"),
                        observationType: OM_TYPE_CATEGORY,
                        unitOfMeasurement: EMPTY_UOM,
                        description: `Taxon Datastream for user ${party.nickname}`,
                        Observations: createObservations(projectRecords, TAXON_DEFINITION),
                        License: createRef(licenseId),
                        Project: createRef(projectId)
                    } as CitSciDataStream)));

                    jobs.push(gracefullyResolve(sta.postDatastream({
                        name: "A datastream of photos",
                        Thing: createRef(thingId),
                        Party: createRef(partyId),
                        Sensor: createRef(sensorId),
                        ObservedProperty: createRef("photo"),
                        observationType: PHOTO_DEFINITION,
                        unitOfMeasurement: EMPTY_UOM,
                        description: `Photo Datastream for user ${party.nickname}`,
                        Observations: createObservations(projectRecords, PHOTO_DEFINITION),
                        License: createRef(licenseId),
                        Project: createRef(projectId)
                    } as CitSciDataStream)));
                }
            });
        });
    });


    return Promise.all(jobs);
}

async function addProjects(sta: STA, records: Record[]) {
    return sta.getProjects().then(async response => {
        const allProjects = response.body;

        const projects = new Map();
        records.map(record => record.project)
            .filter(project => !hasElement(allProjects, project.id))
            .filter(project => !projects.has(project.id))
            .forEach(project => projects.set(project.id, project));
        return Promise.all(Object.values(projects)
            .map(project => gracefullyResolve(sta.postProject({
                "@iot.id": project.id,
                name: project.title,
                description: "This is a demo project",
                runtime: "2020-06-25T03:42:02-02:00",
                classification: "NA",
                termsOfUse: "https://example.org/terms",
                privacyPolicy: "https://exmaple.org/privacy",
                Datastreams: []
            })))).then(() => Object.keys(projects));
    });
}

function createObservations(records: Record[], type: string): Observation[] {
    if (!records) {
        return [];
    }

    const observations: Observation[] = [];
    records.forEach(record => {
        const phenomenonTime = record.resultTime;
        const resultTime = record.resultTime;
        const citSciObservations = record.observations;

        const mappedObservations = citSciObservations.filter(o => o.type === type)
            .map(o => {
                return {
                    // ["@iot.id"]: record.id + "_" + o.name,
                    FeatureOfInterest: createRef(record.feature["@iot.id"]),
                    resultTime,
                    phenomenonTime,
                    result: o.result,
                    parameters: o.parameters,
                    resultQuality: o.resultQuality || "NA",
                    ObservationRelations: [{
                        "@iot.id": "CompositeRelation_" + record.id + "_" + o.name,
                        type: "root",
                        name: "Composite relation",
                        description: "Composite relation",
                        Group: createRef(`group_${record.id}`)
                    }]
                } as Observation;
            });
        observations.push(...mappedObservations);
    });

    return observations;
}

function hasElement(response: any, id: string | undefined) {
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
