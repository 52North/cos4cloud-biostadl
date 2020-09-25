
import { ObservationRelation, OM_TYPE } from "../sta/citSciTypes";
import { Thing, FeatureOfInterest, Observation, NamedValue } from "../sta/staTypes";

export type Record = {
    readonly id: string;
    readonly url: URL;
    readonly user: CitScientist;
    readonly project: CitSciProject;
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
    readonly name: string;
    readonly result: any;
    readonly type: OM_TYPE;
    readonly validTime?: any;
    readonly parameters?: NamedValue[];
    readonly resultQuality?: any;
}
