
export const OM_TYPE_CATEGORY: string = "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation";
export const TAXON_DEFINITION: string = "https://archive.org/services/purl/domain/taxon";
export const PHOTO_DEFINITION: string = "http://people.ne.mediaone.net/scox/data";
export enum OM_TYPE { OM_TYPE_TAXON, OM_TYPE_PHOTO };

export type StaReference = {
    readonly "@iot.id": string;
}

export function createRef(id?: string): StaReference | undefined {
    return id ? { "@iot.id": id } : undefined;
}

export type StaBase = {
    readonly "@iot.id"?: string;
    readonly name: string;
    readonly description: string;
    readonly properties?: object;
}

export type Thing = StaBase & {
    readonly Datastreams?: DataStream[];
    readonly HistoricalLocations?: HistoricalLocation[];
    readonly Locations?: Location[];
}

export type Sensor = StaBase & {
    readonly encodingType: string;
    readonly metadata: any;
}

export type HistoricalLocation = {
    readonly "@iot.id"?: string;
    readonly time: string;
    readonly Locations: Location[];
    Thing?: StaReference;
}

export type Location = StaBase & {
    readonly encodingType: any;
    readonly Things?: Thing[];
    readonly HistoricalLocations?: HistoricalLocation[];
    readonly location: any;
}

export type DataStream = StaBase & {
    readonly observationType: string;
    readonly unitOfMeasurement: any;
    readonly observedArea?: any;
    readonly phenomenonTime?: any;
    readonly ObservedProperty: StaReference | ObservedProperty;
    readonly Observations?: Observation[];
    readonly Thing: StaReference | Thing;
    readonly Sensor: StaReference | Sensor;
    readonly Project?: StaReference | Project;
    readonly License?: StaReference | License;
    readonly Party?: StaReference | Party;
}

export type ObservedProperty = StaBase & {
    readonly definition: string;
}

export type NamedValue = {
    readonly name: string;
    readonly value: string;
}

export type Observation = {
    readonly id?: string;
    readonly resultTime: string;
    readonly phenomenonTime: string;
    readonly result: any;
    readonly resultQuality?: any;
    readonly validTime?: any;
    readonly parameters?: NamedValue[];
    readonly Datastream?: StaReference | DataStream;
    readonly FeatureOfInterest: StaReference | FeatureOfInterest;
    readonly ObservationRelations?: ObservationRelation[];
}

export type FeatureOfInterest = StaBase & {
    readonly encodingType: any;
    readonly feature: any;
}

export type Party = {
    readonly "@iot.id"?: string;
    readonly nickname?: string;
    readonly role: "individual" | "institutional";
    readonly characteristics?: NamedValue[];
    readonly Datastreams?: DataStream[];
}

export type License = {
    readonly "@iot.id"?: string;
    readonly name: string;
    readonly definition: string;
    readonly logo?: string;
    readonly Datastreams?: DataStream[];
}

export type Project = StaBase & {
    readonly url?: string;
    readonly runtime: string;
    readonly Datastreams?: DataStream[];
    readonly classification: string;
    readonly termsOfUse: string;
    readonly privacyPolicy: string;
}

export type ObservationGroup = StaBase & {
    readonly runtime?: string;
    readonly created?: string;
    readonly ObservationRelations: ObservationRelation[];
}

export type ObservationRelation = StaBase & {
    readonly Group: StaReference | ObservationGroup;
    readonly Observation: StaReference | Observation;
    readonly type: string;
}