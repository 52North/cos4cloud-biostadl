import { DataStream, NamedValue, Observation, StaBase, StaReference } from "./staTypes";

export const OM_TYPE_CATEGORY: string = "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation";
export const TAXON_DEFINITION: string = "http://purl.org/biodiversity/taxon/";
export const PHOTO_DEFINITION: string = "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation";
export enum OM_TYPE { OM_TYPE_TAXON, OM_TYPE_PHOTO };

export type CitSciDataStream = DataStream & {
    readonly Project: StaReference | Project;
    readonly License: StaReference | License;
    readonly Party: StaReference | Party;
}

export type CitSciObservation = Observation & {
    readonly ObservationRelations?: ObservationRelation[];
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
}

export type ObservationGroup = StaBase & {
    readonly runtime?: string;
    readonly created?: string;
    readonly ObservationRelations: ObservationRelation[];
}

export type ObservationRelation = StaBase & {
    readonly ObservationGroup: StaReference | ObservationGroup;
    readonly Observation: StaReference | Observation;
    readonly type: string;
}
