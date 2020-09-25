import { OM_TYPE, Project } from "./citSciTypes";

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
}

export type FeatureOfInterest = StaBase & {
    readonly encodingType: any;
    readonly feature: any;
}
