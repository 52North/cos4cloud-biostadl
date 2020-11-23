import STA from "../sta/sta_service";
import { staBaseUrl } from "../common/Config";
import { EMPTY_UOM, NATUSFERA_BASE_URL } from "../common/Constants";
import { TAXON_DEFINITION } from "../sta/staTypes";


const observedPropertyNameTaxon = "taxon";
const observedPropertyNamePhoto = "photo";

const observedPropertyNameObservationTypeMap: any = {
  [observedPropertyNameTaxon]: TAXON_DEFINITION,
  [observedPropertyNamePhoto]: TAXON_DEFINITION
}

const sta = new STA(staBaseUrl);
export default function load(err: any, data: any) {
  if (err) {
    throw new Error(`loading data failed: ${err}`);
  }

  const output: any[] = [];
  for (const row of data) {
    if (!row.user_id) {
      console.debug("reason: user id undefined");
      continue;
    }

    const record: any = {};
    const location = record.location = createPoint(row);
    if (!location) {
      console.debug("reason: location undefined");
      continue;
    }

    parseObservationMetadata(row, record);
    parseTaxonObservation(row, record);
    parsePhotoObservations(row, record);
    output.push(record);

  };

  createNewThings(output).catch(error => console.error(error));
}

function parseObservationMetadata(row: any, record: any) {
  return Object.assign(record, {
    id: row.id,
    uri: row.uri,
    user_id: row.user_id,
    user_login: row.user_login,
    observation: {},
    time_observed_at: row.created_at_utc,
    project: {
      id: row.project_id_0,
      title: row.project_title_0
    }
  });
}

function createPoint(data: any): any {
  let lon = parseFloat(data.longitude);
  let lat = parseFloat(data.latitude);
  if (isNaN(lon) || isNaN(lat)) {
    return undefined;
  }
  return {
    type: "Point",
    coordinates: [lon, lat]
  }
}

function parseTaxonObservation(row: any, record: any) {
  if (!row.taxon_name) {
    console.debug("No taxon name: " + record.id);
  } else {
    record.observation[observedPropertyNameTaxon] = {
      name: observedPropertyNameTaxon,
      observationType: TAXON_DEFINITION,
      parameters: [
        {
          name: "taxon_name",
          value: row.taxon_name
        },
        {
          name: "fenofase",
          value: row.Fenofase
        }
      ],
      result: row.species_guess,
      quality_grade: row.quality_grade
    };
  }
}

function parsePhotoObservations(row: any, record: any) {
  // console.debug("Obs photo count: " + row.observation_photos_count);
  for (let i = 0; i < row.observation_photos_count; i++) {
    record.observation[observedPropertyNamePhoto + "_" + i] = {
      name: observedPropertyNamePhoto + "_" + i,
      observationType: TAXON_DEFINITION,
      parameters: [
        {
          name: "attribution",
          value: row["photo_attribution_" + i]
        }
      ],
      result: row["photo_large_url_" + i],
      quality_grade: row.quality_grade
    };
  }
}

async function createNewThings(records: any) {

  //sensor
  const sensorsResponse = (await sta.getSensors()).body;
  const citSciSensor = {
    name: "Citizen Scientist",
    description: "Person sharing individual observations to the public for scientific use",
    encodingType: "application/pdf",
    metadata: "https://www.weobserve.eu/cops-glossary/#6af6a6f33a552b418"
  };
  const sensor = sensorsResponse.value.find((sensor: any) => sensor.name === "Citizen Scientist");
  const sensorId = sensor ? sensor["@iot.id"] : (await sta.postSensor(citSciSensor)).body["@iot.id"];

  //party
  const partiesResponse = (await sta.getParties()).body;
  const citSciParty = {
    nickName: "Demo Party nickName",
    role: "individual",
    Datastreams: []
  };
  const party = partiesResponse.value.find((party: any) => party.name === "Demo Party nickName");
  const partyId = party ? party["@iot.id"] : (await sta.postParty(citSciParty)).body["@iot.id"];

  //license
  const licensesResponse = (await sta.getLicenses()).body;
  const citSciLicense = {
    name: "MIT License",
    definition: "https://opensource.org/licenses/MIT",
    Datastreams: []
  };
  const license = licensesResponse.value.find((license: any) => license.name === "Demo License.");
  const licenseId = license ? license["@iot.id"] : (await sta.postLicense(citSciLicense)).body["@iot.id"];

  // observed property
  const observedPropertiesResponse = (await sta.getObservedProperties()).body;
  const taxonObservedProperty = {
    name: observedPropertyNameTaxon,
    description: "The canonical name of the observed species",
    definition: "http://purl.org/biodiversity/taxon/"
  };
  const photoObservedProperty = {
    name: observedPropertyNamePhoto,
    description: "A photo of the observed species",
    definition: "http://purl.org/net/photo"
  };

  const localObservedProperties = [photoObservedProperty, taxonObservedProperty];

  let observedPropertyNameIdMap = await createObs(localObservedProperties, observedPropertiesResponse);

  for (let record of records) {

    const things = (await sta.getThings()).body;

    const thingNames = things.value.map((thing: any) => thing.name);

    // TODO return composite observations?
    const observationRecords = createObservationRecords(record, observedPropertyNameIdMap);

    let groupId = "group_" + record.id;
    try {
      //create top level group
      groupId = await createObsGroup(record.id);
    } catch (error) {
      if (error.status === 409) {
        console.debug(`Duplicated groupId: ${record.id}`);
      } else {
        console.error(error);
      }
    }

    let thing = undefined;
    if (!thingNames.includes(record.user_login)) {

      //project
      const projectsResponse = (await sta.getProjects()).body;

      const projectId = "project_" + record.project.id;

      const citSciProject = {
        "@iot.id": projectId,
        name: record.project.title,
        description: "This is a demo project",
        runtime: "2020-06-25T03:42:02-02:00",
        Datastreams: []
      };
      const project = projectsResponse.value.find((project: any) => project["@iot.id"] === projectId);

      if (!project) {
        await sta.postProject(citSciProject);
      }
      const newThing = await createThing(record, sensorId, projectId, partyId, licenseId, observationRecords, observedPropertyNameIdMap);
      try {
        thing = (await sta.postThing(newThing)).body;
      } catch (error) {
        console.error(`could not post thing: ${thing}`);
        continue;
      }

      // console.debug(responseThing.name);
      // console.debug(responseThing[iot_id]);
    } else {
      console.debug("Thing name exists: " + record.user_login + ". Trying to add observations to datastream(s).");
      thing = things.value.filter((thing: any) => thing.name === record.user_login)[0];
    }

    // console.debug("record.user_login " + record.user_login);
    // console.debug("thing id " + thing[iot_id]);
    // console.debug("thing name " + thing["name"]);


    const datastreamObservedPropertyIdMap = await createDatastreamObservedPropertyIdMap(thing);

    //create observationValues

    //foreach observation get observedProperty

    //get datastream for observedProperty

    //add datastream id and group id to observation
    const observationValues = Object.keys(observedPropertyNameIdMap)
      .map(observedPropertyName => createObservationValuesWithDatastream(record, observedPropertyName, observationRecords, groupId, datastreamObservedPropertyIdMap[observedPropertyName]))
      .filter(value => value !== undefined);

    //post observation
    for (const observationArray of observationValues) {
      for (const observation of observationArray) {
        try {
          await sta.postObservation(observation);
        } catch (error) {
          if (error.response.status !== 409) {
            console.error("Could not post observation to STA. " + JSON.stringify(observation));
            console.error(error);
          } else {
            console.debug(`duplicate observation: ${observation["@iot.id"]}: ${error.response}`);
          }
        }
      }
    }
  };
}

function createObservationRecords(record: any, observedPropertyNameIdMap: any) {

  const observationRecords: any = {};

  const observation = record.observation;

  Object.keys(observation)
    .forEach(observedPropertyName => {

      let photo = false;
      if (observedPropertyName.includes(observedPropertyNamePhoto)) {
        photo = true;
      }

      const observationValue = observation[observedPropertyName];

      if (photo) {
        observedPropertyName = observedPropertyNamePhoto;
      }

      if (!observationRecords[observedPropertyName]) {
        observationRecords[observedPropertyName] = {
          observationType: observationValue.observationType,
          observedPropertyId: observedPropertyNameIdMap[observedPropertyName],
          values: []
        };
      }
      const records = observationRecords[observedPropertyName];
      records.values.push(observationValue);
    });

  return observationRecords;
}

async function createDatastreamObservedPropertyIdMap(thing: any) {
  const thingId = thing["@iot.id"];
  const datastreams = (await sta.getDataStreams(thingId)).body;

  let datastreamObservedPropertyIdMap: any = {};

  for (let csDatastream of datastreams.value) {
    const datastreamId = csDatastream["@iot.id"];
    // console.debug("DatastreamId: " + datastreamId);
    const csDatastreamObservedProperties = (await sta.getDataStreamsObservedProperties(datastreamId)).body;
    datastreamObservedPropertyIdMap[csDatastreamObservedProperties.name] = datastreamId;
  }
  return datastreamObservedPropertyIdMap;
}

async function createObs(localObservedProperties: any, observedPropertiesResponse: any) {

  let observedPropertyNameIdMap: any = {};

  for (let localObservedProperty of localObservedProperties) {
    const localObservedPropertyName = localObservedProperty.name;
    const observedProperty = observedPropertiesResponse.value.find((observedProperty: any) => observedProperty.name === localObservedPropertyName);
    const observedPropertyId = observedProperty ? observedProperty["@iot.id"] : (await sta.postObservedProperty(localObservedProperty)).body["@iot.id"];
    observedPropertyNameIdMap[localObservedPropertyName] = observedPropertyId;
  }
  return observedPropertyNameIdMap;
}

async function createThing(record: any, sensorId: string, projectId: string, partyId: string, licenseId: string, observationRecords: any[], observedPropertyNameIdMap: any) {

  let groupId = "group_" + record.id;

  try {
    groupId = await createObsGroup(record.id);
  } catch (error) {
    console.error(error);
  }

  const featuresResponse = (await sta.getFeatures()).body;
  //feature of interest
  const citSciFeature = {
    name: "observed location",
    description: "insitu location where " + record.id + " observation has been made",
    encodingType: "application/vnd.geo+json",
    feature: record.location
  };
  const feature = featuresResponse.value.find((feature: any) => feature.name === "Demo Feature.");
  const featureId = feature ? feature["@iot.id"] : (await sta.postFeature(citSciFeature)).body["@iot.id"];

  const user = record.user_login;

  const datastreams = Object.keys(observedPropertyNameIdMap)
    .map(observedPropertyName => createDatastream(record, sensorId, projectId, partyId, licenseId, groupId, observedPropertyNameIdMap[observedPropertyName], observedPropertyName, observedPropertyNameObservationTypeMap[observedPropertyName], observationRecords))
    .filter(value => value !== undefined);


  //if a datastream was not created due to no observations, 
  //we will create the datastream for the observed property with empty observation list
  //this is necessary to add possible observations of the observed property to the thing afterwards

  const historicalLocations: any[] = [];
  datastreams.forEach(datastream => {
    const observations = datastream.Observations;
    if (Array.isArray(observations)) {
      for (let observation of observations) {
        const foi = observation.FeatureOfInterest;
        const location = createLocation(foi.feature);
        const time = observation.phenomenonTime;
        historicalLocations.push({
          time,
          Locations: [location]
        })
      }
    }
  })
  // const historicalLocations = createHistoricalLocations(re)
  const thing = {
    name: user,
    description: "Citizen Scientist",
    properties: {
      uri: NATUSFERA_BASE_URL + "/users/" + record.user_id,
      id: record.user_id
    },
    Datastreams: datastreams,
    HistoricalLocations: historicalLocations
  };

  return thing;
}

async function createObsGroup(recordId: string) {
  // group
  const groupsResponse = (await sta.getGroups()).body;
  const citSciGroup = {
    "@iot.id": "group_" + recordId,
    name: "Observation composition " + recordId,
    description: "Composite group of a citizen science observation",
    properties: {
      type: "topLevel"
    },
    relations: []
  };
  const group = groupsResponse.value.find((group: any) => group.name === "Observation group " + recordId);
  const groupId = group ? group["@iot.id"] : (await sta.postGroup(citSciGroup)).body["@iot.id"];
  return "group_" + recordId;
}

function createDatastream(record: any, sensorId: string, projectId: string, partyId: string, licenseId: string, groupId: string, observedPropertyId: string, observedPropertyName: string, observationType: string, observationRecords: any[]) {
  const observationValues = createObservationValues(record, observedPropertyName, observationRecords, groupId);

  //console.debug("Observationvalues: " + observationValues);
  //console.debug("Record id: " + record.id);

  // if(!observationValues || observationValues.length < 1){
  //   console.debug("observationValues undefined or empty");
  //   return;
  // }

  //const observation = observationRecords[observedPropertyName];

  // if(!observation){
  //   //undefined datastream will be filtered out
  //   return;
  // }

  const user: string = record.user_login;
  return {
    name: "Datastream of user " + user + " (observing " + observedPropertyName + ")",
    description: "An observation datastream taken from a Citizen Scientist via mobile phone",
    observationType: observationType,
    ObservedProperty: {
      "@iot.id": observedPropertyId
    },
    unitOfMeasurement: EMPTY_UOM,
    Sensor: {
      "@iot.id": sensorId
    },
    Observations: observationValues,
    License: {
      "@iot.id": licenseId
    },
    Party: {
      "@iot.id": partyId
    },
    Project: {
      "@iot.id": projectId
    }
  };
}

function createObservationValues(record: any, observedPropertyName: string, observationRecords: any, groupId: string) {

  const observationvalue = observationRecords[observedPropertyName];
  if (!observationvalue) {
    return [];
  }
  return observationvalue.values.map((value: any) => createObservationValue(record, value, groupId))
    .filter((o: any) => o !== undefined);
}

function createObservationValue(record: any, observation: any, groupId: string) {
  const observationtime = record.time_observed_at;
  if (!observationtime || observationtime.length === 0) {
    //console.debug("Observation time is not available! " + JSON.stringify(record, null, 2));
    console.debug("Observation time is not available! Observation will not be included.");
    return undefined;
  }

  const value = {
    ["@iot.id"]: record.id + "_" + observation.name,
    phenomenonTime: observationtime,
    resultTime: observationtime,
    result: observation.result,
    resultQuality: observation.quality_grade,
    parameters: observation.parameters,
    FeatureOfInterest: {
      name: "observed location",
      description: "insitu location where " + observation.name + " observation has been made",
      encodingType: "application/vnd.geo+json",
      feature: record.location
    },
    ObservationRelations: [
      {
        "@iot.id": "testRelation_" + record.id + "_" + observation.name,
        "type": "root",
        "Group": {
          "@iot.id": groupId
        }
      }
    ]
  };
  return value;
}

function createObservationValuesWithDatastream(record: any, observedPropertyName: string, observationRecords: any, groupId: string, datastreamId: string) {

  const observationvalue = observationRecords[observedPropertyName];
  if (!observationvalue) {
    return [];
  }
  return observationvalue.values.map((value: any) => createObservationValueWithDatastream(record, value, groupId, datastreamId))
    .filter((o: any) => o !== undefined);
}

function createObservationValueWithDatastream(record: any, observation: any, groupId: string, datastreamId: string) {
  const observationtime = record.time_observed_at;
  if (!observationtime || observationtime.length === 0) {
    //console.debug("Observation time is not available! " + JSON.stringify(record, null, 2));
    console.debug("Observation time is not available! Observation will not be included.");
    return undefined;
  }

  const value = {
    ["@iot.id"]: record.id + "_" + observation.name,
    phenomenonTime: observationtime,
    resultTime: observationtime,
    result: observation.result,
    resultQuality: observation.quality_grade,
    parameters: observation.parameters,
    FeatureOfInterest: {
      name: "observed location",
      description: "insitu location where " + observation.name + " observation has been made",
      encodingType: "application/vnd.geo+json",
      feature: record.location
    },
    Datastream: {
      "@iot.id": datastreamId
    },
    ObservationRelations: [
      {
        "@iot.id": "testRelation_" + record.id + "_" + observation.name,
        "type": "root",
        "Group": {
          "@iot.id": groupId
        }
      }
    ]
  };
  return value;
}

// async function createNewObservations(output: any[]) {

//   const observationsByUserLogin: any = {};
//   output.forEach(record => {
//     if (!observationsByUserLogin[record.user_login]) {
//       observationsByUserLogin[record.user_login] = [];
//     }
//     const observations = observationsByUserLogin[record.user_login];
//     try {
//       observations.push(createObservation(record));
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   Object.keys(observationsByUserLogin)
//     .forEach(async user_login => {
//       const query = {
//         "$select": "id,Thing",
//         "$filter": "ObservedProperty/name eq 'Taxon' and Thing/name eq '" + user_login + "'"
//         //"$expand": "Thing($select=name)" // matches user_login
//       };
//       const datastreamsResponse = (await sta.getDataStreams(query)).body;
//       const taxonDatastream = datastreamsResponse.value[0] || undefined;
//       if (taxonDatastream) {
//         const datastreamId = taxonDatastream["@iot.id"];
//         const observations = observationsByUserLogin[user_login];
//         observations.forEach(async (observation: any) => {
//           observation.Datastream = {
//             "@iot.id": datastreamId
//           }
//           sta.sendPost(staBaseUrl + "/Observations", observation);
//         })
//       } else {
//         console.warn("no proper datastream found for user '" + user_login + "' and ObservedProperty 'Taxon'");
//       }
//     });
// }

function createLocation(geometry: any) {
  return {
    name: "observed location",
    description: "The location where the observation has been made (insitu for now)",
    encodingType: "application/vnd.geo+json",
    location: geometry
  }
}

// REQUEST METHODS


const columns = [
  "Altitud",
  "Calle o plaza",
  "Centre/Entitat",
  "Codi de l'observador",
  "Codi del punt d'observació",
  "Comunidad autónoma",
  "Enlace a la foto",
  "Estadio",
  "Fecha de la identificación (dwc)",
  "Fenofase",
  "Hàbitat o ecosistema",
  "Identificador Gràfic intern",
  "Identificador d'individu",
  "Identificador de l'individu observat",
  "Nom vulgar",
  "Nombre del paraje",
  "Si és planta: tipus de dispersió de les llavors",
  "Si és planta: tipus de fulla",
  "Zona protegida",
  "cached_votes_total",
  "captive",
  "captive_flag",
  "comments_count",
  "community_taxon_id",
  "coordinates_obscured",
  "created_at",
  "created_at_utc",
  "delta",
  "description",
  "faves_count",
  "geoprivacy",
  "iconic_taxon_id",
  "iconic_taxon_name",
  "id",
  "id_please",
  "identif_created_at_0",
  "identif_created_at_1",
  "identif_created_at_2",
  "identif_created_at_3",
  "identif_created_at_4",
  "identif_created_at_5",
  "identif_created_at_6",
  "identif_current_0",
  "identif_current_1",
  "identif_current_2",
  "identif_current_3",
  "identif_current_4",
  "identif_current_5",
  "identif_current_6",
  "identif_id_6",
  "identif_id_0",
  "identif_id_1",
  "identif_id_2",
  "identif_id_3",
  "identif_id_4",
  "identif_id_5",
  "identif_taxon_change_id_2",
  "identif_taxon_change_id_3",
  "identif_taxon_name_2",
  "identif_taxon_name_3",
  "identif_taxon_rank_2",
  "identif_taxon_rank_3",
  "identif_updated_at_2",
  "identif_updated_at_3",
  "identif_user_id_2",
  "identif_user_id_3",
  "identif_user_login_2",
  "identif_user_login_3",
  "identif_user_name_2",
  "identif_user_name_3",
  "identifications_count",
  "last_indexed_at",
  "latitude",
  "location_is_exact",
  "longitude",
  "map_scale",
  "mappable",
  "num_identification_agreements",
  "num_identification_disagreements",
  "oauth_application_id",
  "observation_photos_count",
  "observation_sounds_count",
  "observed_on",
  "observed_on_string",
  "out_of_range",
  "owners_identification_from_vision",
  "photo_attribution_0",
  "photo_attribution_1",
  "photo_attribution_2",
  "photo_attribution_3",
  "photo_attribution_4",
  "photo_attribution_5",
  "photo_attribution_6",
  "photo_id_0",
  "photo_id_1",
  "photo_id_2",
  "photo_id_3",
  "photo_id_4",
  "photo_id_5",
  "photo_id_6",
  "photo_large_url_0",
  "photo_large_url_1",
  "photo_large_url_2",
  "photo_large_url_3",
  "photo_large_url_4",
  "photo_large_url_5",
  "photo_large_url_6",
  "place_guess",
  "positional_accuracy",
  "positioning_device",
  "positioning_method",
  "project_id_0",
  "project_id_1",
  "project_id_2",
  "project_id_3",
  "project_title_0",
  "project_title_1",
  "project_title_2",
  "project_title_3",
  "public_positional_accuracy",
  "quality_grade",
  "site_id",
  "species_guess",
  "taxon_geoprivacy",
  "taxon_id",
  "taxon_name",
  "taxon_rank",
  "time_observed_at",
  "time_observed_at_utc",
  "time_zone",
  "updated_at",
  "updated_at_utc",
  "uri",
  "user_id",
  "user_login",
  "usuario externo",
  "uuid",
  "zic_time_zone"
];