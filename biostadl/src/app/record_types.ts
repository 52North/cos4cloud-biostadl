
import { Tracing } from "trace_events";
import { Thing, FeatureOfInterest, Observation, NamedValue } from "../sta/staTypes";

export type ParsedRecord = {
    readonly id: string;
    readonly url: URL;
    readonly user: CitScientist;
    readonly projects: CitSciProject[];
    readonly feature: FeatureOfInterest;
    readonly observations: CitSciObservation[];
    readonly resultTime: string;
}

export type CitScientist = {
    readonly id: string;
    readonly name: string;
    readonly url: string;
}

export type CitSciProject = {
    readonly id: string;
    readonly title: string;
}

export type CitSciObservation = {
    readonly recordId: string;
    readonly featureId: string;
    readonly resultTime: string;
    readonly name: string;
    readonly result: any;
    readonly type: string;
    readonly validTime?: any;
    readonly parameters?: NamedValue[];
    readonly resultQuality?: any;
    readonly licenseGuess?: LicenseGuess;
}

export type LicenseGuess = {
    readonly license: string,
    readonly attribution?: string;
}
