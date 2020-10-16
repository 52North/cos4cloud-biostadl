
import superagent, { SuperAgentRequest } from "superagent";
import { STA_ID } from "../config/Constants";
import { DataStream } from "./staTypes";


export default class STA {

    url = "localhost:8080/sta";

    constructor(url: string) {
        this.url = url;
    }

    async getThing(id: string): Promise<any> {
        return this._getItem("Things", id);
    }

    async getThings(query?: any): Promise<any> {
        return _sendGet(this.url + "/Things", query);
    }

    async getSensors(query?: any): Promise<any> {
        return _sendGet(this.url + "/Sensors", query);
    }

    async getObservedProperties(query?: any): Promise<any> {
        return _sendGet(this.url + "/ObservedProperties", query);
    }

    async getDataStreams(query: any): Promise<any> {
        return _sendGet(this.url + "/Datastreams", query);
    }

    async getDataStreamsFor(thingId: string): Promise<any> {
        return _sendGet(this.url + "/Things(" + thingId + ")/Datastreams", "");
    }

    async getProjects(query?: any): Promise<any> {
        return _sendGet(this.url + "/Projects", query);
    }

    async getParties(query?: any): Promise<any> {
        return _sendGet(this.url + "/Parties", query);
    }

    async getLicenses(query?: any): Promise<any> {
        return _sendGet(this.url + "/Licenses", query);
    }

    async getGroups(query?: any): Promise<any> {
        return _sendGet(this.url + "/ObservationGroups", query);
    }

    async getFeatures(query?: any): Promise<any> {
        return _sendGet(this.url + "/FeaturesOfInterest", query);
    }

    async getDataStreamsObservedProperties(datastreamId: string): Promise<any> {
        return _sendGet(this.url + "/Datastreams(" + datastreamId + ")/ObservedProperty", "");
    }

    async postSensor(sensor: any): Promise<any> {
        return _sendPost(this.url + "/Sensors", sensor);
    }

    async postObservedProperty(observedProperty: any): Promise<any> {
        return _sendPost(this.url + "/ObservedProperties", observedProperty);
    }

    async postThing(thing: any): Promise<any> {
        // console.debug(JSON.stringify(thing));
        return _sendPost(this.url + "/Things", thing);
    }

    async postHistoricalLocation(histLoc: any): Promise<any> {
        return _sendPost(`${this.url}/HistoricalLocations`, histLoc);
    }

    async postProject(project: any): Promise<any> {
        //console.debug(project);
        return _sendPost(this.url + "/Projects", project);
    }

    async postParty(party: any): Promise<any> {
        return _sendPost(this.url + "/Parties", party);
    }

    async postLicense(license: any): Promise<any> {
        //console.debug(license);
        return _sendPost(this.url + "/Licenses", license);
    }

    async postGroup(group: any): Promise<any> {
        //console.debug(group);
        return _sendPost(this.url + "/ObservationGroups", group);
    }

    async postFeature(feature: any): Promise<any> {
        //console.debug(feature);
        return _sendPost(this.url + "/FeaturesOfInterest", feature);
    }

    async postObservation(observation: any): Promise<any> {
        //console.debug(group);
        return _sendPost(this.url + "/Observations", observation);
    }

    async postDatastream(datastream: DataStream): Promise<any> {
        return _sendPost(`${this.url}/Datastreams`, datastream);
    }

    async patchThing(thing: any): Promise<any> {
        return this._patchItem("Things", thing);
    }

    async _getItem(type: string, id: string): Promise<any> {
        return _sendGet(`${this.url}/${type}(${id})`, {});
    }

    async _patchItem(type: string, item: any): Promise<any> {
        return _sendPatch(`${this.url}/${type}(${item[STA_ID]})`, item);
    }

}

async function _sendGet(url: string, query: any): Promise<any> {
    // if (query?:any) : Promise<any> {
    //   console.debug("GETting: " + url + " and query " + JSON.stringify(query, null, 2));
    // } else {
    //   console.debug("GETting: " + url);
    // }
    const request = superagent.get(url)
        .set("content-type", "application/json; charset=utf-8")
        .set("accept", "application/json");
    if (query) {
        request.query(query);
    }
    return request.catch((error: any) => {
        const response = error.response;
        const details = response ? JSON.stringify(response, null, 2) : error;
        console.error(`errornous request: ${details}`);
    });
}

async function _sendPatch(url: string, payload: any): Promise<any> {
    return _sendPayload(superagent.patch(url), payload);
}

async function _sendPost(url: string, payload: any): Promise<any> {
    // console.debug("POSTing to: " + url + "\n", JSON.stringify(payload, null, 2));
    return _sendPayload(superagent.post(url), payload);
}

async function _sendPayload(httpMethod: SuperAgentRequest, json: any): Promise<any> {
    return httpMethod.send(json)
        .set("content-type", "application/json; charset=utf-8")
        .set("accept", "application/json")
        .then(response => {
            if (response.status === 201) {
                // follow location after entity creation
                const location = response.header?.location;
                return location ? _sendGet(location, {}) : response;
            }
            return response;
        })
        .catch(error => {
            const response = error.response;
            console.debug(JSON.stringify(response, null, 2));
            throw error;
        });
}
