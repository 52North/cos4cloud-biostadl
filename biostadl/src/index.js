const fs = require('fs');
const superagent = require("superagent");
const parseCSV = require('csv-parse');


// CONSTANTS
const filePath = "./RitmeNatura_odc_exerpt_2.csv";
const natusferaBaseUrl = "https://natusfera.gbif.es";
const staBaseUrl = "http://localhost:8080/sta";
const emptyUOM = {
  name: null,
  symbol: null,
  definition: null
};

const observationTypeTaxon = "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation";
const observationTypePhoto = "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation";

const observedPropertyNameTaxon = "taxon";
const observedPropertyNamePhoto = "photo";

const observedPropertyNameObservationTypeMap = {
  [observedPropertyNameTaxon] : observationTypeTaxon,
  [observedPropertyNamePhoto] : observationTypePhoto
}

const iot_id = "@iot.id";

fs.readFile(filePath, (err, data) => {
  if (err) {
    superagent.get("https://external.opengeospatial.org/twiki_public/pub/CitSciIE/OpenDataChallenge/RitmeNatura_odc.csv")
            .set("user-agent", "some-agent")
            .set("accept", "*/*; charset=utf-8")
            .end((err, res) => fs.writeFile(filePath, res.text, (err) => {
              if (err) throw err;
              const data = fs.readFileSync(filePath);
              loadData(data);
            }))
  } else {
    loadData(data);
  }
});

function loadData(data) {
  try {
    parseCSV(data, {
      columns: true,
      delimiter: ";",
      trim: true
    }, loadObservations);
  } catch (error) {
    console.error(error);
  }
}

function loadObservations(err, data) {
  if (err) {
    throw new Error(`reading csv failed: ${err}`);
  }

  const output = [];
  data.forEach(row => {
    if (!row.user_id) {
      console.log("reason: user id undefined");
      return;
    }

    const record = {};
    const location = record.location = createPoint(row);
    if (!location) {
      console.log("reason: location undefined");
      return;
    }

    parseObservationMetadata(row, record);
    parseTaxonObservation(row, record);
    parsePhotoObservations(row, record);
    output.push(record);

  });//.on("end", async () => {
    
  createNewThings(output).catch(error => console.error(error));
  //}
}

function parseObservationMetadata(row, record) {
  return Object.assign(record, {
    id: row.id,
    uri: row.uri,
    user_id: row.user_id,
    user_login: row.user_login,
    observation: {},
    time_observed_at: row.time_observed_at,
    project: {
      id: row.project_id_0,
      title: row.project_title_0
    }
  });
}

function createPoint(data) {
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

function parseTaxonObservation(row, record) {
  if (!row.taxon_name) {
    console.log("No taxon name: " + record.id);
  } else {
    record.observation[observedPropertyNameTaxon] = {
      name: observedPropertyNameTaxon,
      observationType: observationTypeTaxon,
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

function parsePhotoObservations(row, record) {
  console.log("Obs photo count: " + row.observation_photos_count);
  for (let i = 0; i < row.observation_photos_count; i++) {
    record.observation[observedPropertyNamePhoto + "_" + i] = {
      name: observedPropertyNamePhoto + "_" + i,
      observationType: observationTypePhoto,
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

async function createNewThings(records) {

  //sensor
  const sensorsResponse = (await getSensors()).body;
  const citSciSensor = {
    name: "Citizen Scientist",
    description: "Person sharing individual observations to the public for scientific use",
    encodingType: "application/pdf",
    metadata: "https://www.weobserve.eu/cops-glossary/#6af6a6f33a552b418"
  };
  const sensor = sensorsResponse.value.find(sensor => sensor.name === "Citizen Scientist");
  const sensorId = sensor ? sensor["@iot.id"] : (await postSensor(citSciSensor)).body["@iot.id"];  

  //party
  const partiesResponse = (await getParties()).body;
  const citSciParty = {
    nickName: "Demo Party nickName",
    role: "individual",
    Datastreams: []
  };
  const party = partiesResponse.value.find(party => party.name === "Demo Party nickName");
  const partyId = party ? party["@iot.id"] : (await postParty(citSciParty)).body["@iot.id"];
  
  //license
  const licensesResponse = (await getLicenses()).body;
  const citSciLicense = {
    name: "MIT License",
    definition: "https://opensource.org/licenses/MIT",
    Datastreams: []
  };
  const license = licensesResponse.value.find(license => license.name === "Demo License.");
  const licenseId = license ? license["@iot.id"] : (await postLicense(citSciLicense)).body["@iot.id"];

  // observed property
  const observedPropertiesResponse = (await getObservedProperties()).body;
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

  const things = (await getThings()).body;

  const thingNames = things.value.map(thing => thing.name);
 
  const newThings = {};
    if (!newThings[record.id] && !thingNames.includes(record.user_login)) {
      const observationRecords = {};
    
      const observation = record.observation;

      Object.keys(observation)
            .forEach(observedPropertyName => {
  
                let photo = false;
                if(observedPropertyName.includes(observedPropertyNamePhoto)){
                  photo = true;
                }
  
              const observationValue = observation[observedPropertyName];
  
              if(photo){
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

      //project
      const projectsResponse = (await getProjects()).body;
      
      const projectId = "project_" + record.project.id;
      
      const citSciProject = {
        "@iot.id": projectId,
        name: record.project.title,
        description: "This is a demo project",
        runtime: "2020-06-25T03:42:02-02:00",
        Datastreams: []
      };
      const project = projectsResponse.value.find(project => project["@iot.id"] === projectId);
      
      if(!project){
        await postProject(citSciProject)
      }
      newThings[record.user_id] = await createThing(record, sensorId, projectId, partyId, licenseId, observationRecords, observedPropertyNameIdMap);
      let responseThing = (await postThing(newThings[record.user_id])).body;
      
      // console.log(responseThing.name);
      // console.log(responseThing[iot_id]);
    } else {

      console.log("Thing name exists: " + record.user_login + ". Trying to add observations to datastream(s).");

      const observationRecords = {};
    
      const observation = record.observation;

      Object.keys(observation)
            .forEach(observedPropertyName => {
  
                let photo = false;
                if(observedPropertyName.includes(observedPropertyNamePhoto)){
                  photo = true;
                }
  
              const observationValue = observation[observedPropertyName];
  
              if(photo){
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

      //get thing
      const thing = things.value.filter(thing => thing.name === record.user_login)[0];

      // console.log("record.user_login " + record.user_login);
      // console.log("thing id " + thing[iot_id]);
      // console.log("thing name " + thing["name"]);

      //create group id
      let groupId = "group_" + record.id;

      try {
          groupId = await createObsGroup(record.id);
      } catch (error) {
          console.error(error);
      }

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
            await postObservation(observation);
          } catch (error) {
            console.error("Could not post observation to STA. " + JSON.stringify(observation));
            console.error(error);
          }
        }
      }
    }
  };
}

async function createDatastreamObservedPropertyIdMap(thing){
  const thingId = thing["@iot.id"];
  const datastreams = (await getDataStreams(thingId)).body;

  let datastreamObservedPropertyIdMap = {};

  for(let csDatastream of datastreams.value){
    const datastreamId = csDatastream["@iot.id"];
    // console.log("DatastreamId: " + datastreamId);
    const csDatastreamObservedProperties = (await getDataStreamsObservedProperties(datastreamId)).body;
    datastreamObservedPropertyIdMap[csDatastreamObservedProperties.name] = datastreamId;
  }
  return datastreamObservedPropertyIdMap;
}

async function createObs(localObservedProperties, observedPropertiesResponse) {

  let observedPropertyNameIdMap = {};

  for (let localObservedProperty of localObservedProperties) {    
    const localObservedPropertyName = localObservedProperty.name;
    const observedProperty = observedPropertiesResponse.value.find(observedProperty => observedProperty.name === localObservedPropertyName);
    const observedPropertyId = observedProperty ? observedProperty["@iot.id"] : (await postObservedProperty(localObservedProperty)).body["@iot.id"];
    observedPropertyNameIdMap[localObservedPropertyName] = observedPropertyId;
  }
  return observedPropertyNameIdMap;
}

async function createThing(record, sensorId, projectId, partyId, licenseId, observationRecords, observedPropertyNameIdMap) {
  
  let groupId = "group_" + record.id;

  try {
      groupId = await createObsGroup(record.id);
  } catch (error) {
      console.error(error);
  }
  const featuresResponse = (await getFeatures()).body;
    //feature of interest
  const citSciFeature = {
    name: "observed location",
    description: "insitu location where " + record.id + " observation has been made",
    encodingType: "application/vnd.geo+json",
    feature: record.location  
  };
  const feature = featuresResponse.value.find(feature => feature.name === "Demo Feature.");
  const featureId = feature ? feature["@iot.id"] : (await postFeature(citSciFeature)).body["@iot.id"];

  const user = record.user_login;
  
  const datastreams = Object.keys(observedPropertyNameIdMap)
                            .map(observedPropertyName => createDatastream(record, sensorId, projectId, partyId, licenseId, groupId, observedPropertyNameIdMap[observedPropertyName], observedPropertyName, observedPropertyNameObservationTypeMap[observedPropertyName], observationRecords))
                            .filter(value => value !== undefined);


  //if a datastream was not created due to no observations, 
  //we will create the datastream for the observed property with empty observation list
  //this is necessary to add possible observations of the observed property to the thing afterwards

  const historicalLocations = [];
  datastreams.forEach(datastream => {
    const observations = datastream.Observations;
    if(Array.isArray(observations)){
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
      uri: natusferaBaseUrl + "/users/" + record.user_id,
      id: record.user_id
    },
    Datastreams: datastreams,
    HistoricalLocations: historicalLocations
  };

  return thing;
}

async function createObsGroup(recordId){
  // group
  const groupsResponse = (await getGroups()).body;
  const citSciGroup = {
    "@iot.id": "group_" + recordId,
    name: "Observation group " + recordId,
    description: "Observation belonging to group " + recordId,
    relations: []
  };
  const group = groupsResponse.value.find(group => group.name === "Observation group " + recordId);
  const groupId = group ? group["@iot.id"] : (await postGroup(citSciGroup)).body["@iot.id"];
  return "group_" + recordId;
}

function createDatastream(record, sensorId, projectId, partyId, licenseId, groupId, observedPropertyId, observedPropertyName, observationType, observationRecords) {
  const observationValues = createObservationValues(record, observedPropertyName, observationRecords, groupId);

  //console.log("Observationvalues: " + observationValues);
  //console.log("Record id: " + record.id);
  
  // if(!observationValues || observationValues.length < 1){
  //   console.log("observationValues undefined or empty");
  //   return;
  // }

  //const observation = observationRecords[observedPropertyName];
  
  // if(!observation){
  //   //undefined datastream will be filtered out
  //   return;
  // }

  const user = record.user_login;
  return {
    name: "Datastream of user " + user + " (observing " + observedPropertyName + ")",
    description: "An observation datastream taken from a Citizen Scientist via mobile phone",
    observationType: observationType,
    ObservedProperty: {
      "@iot.id": observedPropertyId
    },
    unitOfMeasurement: emptyUOM,
    Sensor: {
      "@iot.id": sensorId
    },
    Observations: observationValues,
    License : {
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

function createObservationValues(record, observedPropertyName, observationRecords, groupId) {

  const observationvalue = observationRecords[observedPropertyName];
  if(!observationvalue) {
    return [];
  }
  return observationvalue.values.map(value => createObservationValue(record, value, groupId))
                                .filter(o => o !== undefined);
}

function createObservationValue(record, observation, groupId) {
  const observationtime = record.time_observed_at;
  if (!observationtime || observationtime.length === 0) {
    //console.log("Observation time is not available! " + JSON.stringify(record, null, 2));
    console.log("Observation time is not available! Observation will not be included.");
    return undefined;
  }

  const value = {
    ["@iot.id"] : record.id + "_" + observation.name,
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

function createObservationValuesWithDatastream(record, observedPropertyName, observationRecords, groupId, datastreamId) {

  const observationvalue = observationRecords[observedPropertyName];
  if(!observationvalue) {
    return [];
  }
  return observationvalue.values.map(value => createObservationValueWithDatastream(record, value, groupId, datastreamId))
                                .filter(o => o !== undefined);
}

function createObservationValueWithDatastream(record, observation, groupId, datastreamId) {
  const observationtime = record.time_observed_at;
  if (!observationtime || observationtime.length === 0) {
    //console.log("Observation time is not available! " + JSON.stringify(record, null, 2));
    console.log("Observation time is not available! Observation will not be included.");
    return undefined;
  }

  const value = {
    ["@iot.id"] : record.id + "_" + observation.name,
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
    Datastream : {
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

async function createNewObservations(output) {

  const observationsByUserLogin = {};
  output.forEach(record => {
    if (!observationsByUserLogin[record.user_login]) {
      observationsByUserLogin[record.user_login] = [];
    }
    const observations = observationsByUserLogin[record.user_login];
    try {
      observations.push(createObservation(record));
    } catch(err) {
      console.error(err);
    }
  });

  Object.keys(observationsByUserLogin)
        .forEach(async user_login => {
          const query = {
            "$select": "id,Thing",
            "$filter": "ObservedProperty/name eq 'Taxon' and Thing/name eq '" + user_login + "'"
            //"$expand": "Thing($select=name)" // matches user_login
          };
          const datastreamsResponse = (await getDataStreams(query)).body;
          const taxonDatastream = datastreamsResponse.value[0] || undefined;
          if (taxonDatastream) {
            const datastreamId = taxonDatastream["@iot.id"];
            const observations = observationsByUserLogin[user_login];
            observations.forEach(async observation => {
              observation.Datastream = {
                "@iot.id": datastreamId
              }
              sendPost(staBaseUrl + "/Observations", observation);
            })
          } else {
            console.warn("no proper datastream found for user '" + user_login + "' and ObservedProperty 'Taxon'");
          }
        });
  }

function createLocation(geometry) {
  return {
    name: "observed location",
    description: "The location where the observation has been made (insitu for now)",
    encodingType: "application/vnd.geo+json",
    location: geometry
  }
}

// REQUEST METHODS


async function getThings(query) {
  return sendGet(staBaseUrl + "/Things", query);
}

async function getSensors(query) {
  return sendGet(staBaseUrl + "/Sensors", query);
}

async function getObservedProperties(query) {
  return sendGet(staBaseUrl + "/ObservedProperties", query);
}

async function getDataStreams(query) {
  return sendGet(staBaseUrl + "/Datastreams", query);
}

async function getProjects(query) {
  return sendGet(staBaseUrl + "/Projects", query);
}

async function getParties(query) {
  return sendGet(staBaseUrl + "/Parties", query);
}

async function getLicenses(query) {
  return sendGet(staBaseUrl + "/Licenses", query);
}

async function getGroups(query) {
  return sendGet(staBaseUrl + "/ObservationGroups", query);
}

async function getFeatures(query) {
  return sendGet(staBaseUrl + "/FeaturesOfInterest", query);
}

async function getDataStreams(thingId) {
  return sendGet(staBaseUrl + "/Things(" + thingId + ")/Datastreams", "");
}

async function getDataStreamsObservedProperties(datastreamId) {
  return sendGet(staBaseUrl + "/Datastreams(" + datastreamId + ")/ObservedProperty", "");
}

async function sendGet(url, query) {
  // if (query) {
  //   console.log("GETting: " + url + " and query " + JSON.stringify(query, null, 2));
  // } else {
  //   console.log("GETting: " + url);
  // }
  const request = superagent.get(url)
                            .set("content-type", "application/json; charset=utf-8")
                            .set("accept", "application/json");
  if (query) {
    request.query(query);
  }
  return request.catch(error => {
      const response = error.response;
      console.error("errornous request: " + JSON.stringify(response, null, 2));
    });
}

async function postSensor(sensor) {
  return sendPost(staBaseUrl + "/Sensors", sensor);
}

async function postObservedProperty(observedProperty) {
  return sendPost(staBaseUrl + "/ObservedProperties", observedProperty);
}

async function postThing(thing) {
  // console.log(JSON.stringify(thing));
  return sendPost(staBaseUrl + "/Things", thing);
}

async function postProject(project) {
  //console.log(project);
  return sendPost(staBaseUrl + "/Projects", project);
}

async function postParty(party) {
  return sendPost(staBaseUrl + "/Parties", party);
}

async function postLicense(license) {
  //console.log(license);
  return sendPost(staBaseUrl + "/Licenses", license);
}

async function postGroup(group) {
  //console.log(group);
  return sendPost(staBaseUrl + "/ObservationGroups", group);
}

async function postFeature(feature) {
  //console.log(feature);
  return sendPost(staBaseUrl + "/FeaturesOfInterest", feature);
}

async function postObservation(observation) {
  //console.log(group);
  return sendPost(staBaseUrl + "/Observations", observation);
}

async function sendPost(url, payload) {
  // console.log("POSTing to: " + url + "\n", JSON.stringify(payload, null, 2));
  return superagent.post(url)
                   .send(payload)
                   .set("content-type", "application/json; charset=utf-8")
                   .set("accept", "application/json")
                   .catch(error => {
                     const response = error.response;
                     const stringResponse = JSON.stringify(response, null, 2);
                     console.error(stringResponse);
                     fs.writeFile("d:/tmp/dataloadingerrors/" + payload.name + ".txt", stringResponse, function (err) {
                       if (err) {
                         console.log("Error saving file.");
                        };
                        console.log('File saved!');
                      });
                    });
}

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