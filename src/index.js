const fs = require('fs');
const superagent = require("superagent");
const parse = require('csv-parse');

// const columns = [
// "Altitud",
// "Calle o plaza",
// "Centre/Entitat",
// "Codi de l'observador",
// "Codi del punt d'observació",
// "Comunidad autónoma",
// "Enlace a la foto",
// "Estadio",
// "Fecha de la identificación (dwc)",
// "Fenofase",
// "Hàbitat o ecosistema",
// "Identificador Gràfic intern",
// "Identificador d'individu",
// "Identificador de l'individu observat",
// "Nom vulgar",
// "Nombre del paraje",
// "Si és planta: tipus de dispersió de les llavors",
// "Si és planta: tipus de fulla",
// "Zona protegida",
// "cached_votes_total",
// "captive",
// "captive_flag",
// "comments_count",
// "community_taxon_id",
// "coordinates_obscured",
// "created_at",
// "created_at_utc",
// "delta",
// "description",
// "faves_count",
// "geoprivacy",
// "iconic_taxon_id",
// "iconic_taxon_name",
// "id",
// "id_please",
// "identif_created_at_0",
// "identif_created_at_1",
// "identif_created_at_2",
// "identif_created_at_3",
// "identif_created_at_4",
// "identif_created_at_5",
// "identif_created_at_6",
// "identif_current_0",
// "identif_current_1",
// "identif_current_2",
// "identif_current_3",
// "identif_current_4",
// "identif_current_5",
// "identif_current_6",
// "identif_id_6",
// "identif_id_0",
// "identif_id_1",
// "identif_id_2",
// "identif_id_3",
// "identif_id_4",
// "identif_id_5",
// "identif_taxon_change_id_2",
// "identif_taxon_change_id_3",
// "identif_taxon_name_2",
// "identif_taxon_name_3",
// "identif_taxon_rank_2",
// "identif_taxon_rank_3",
// "identif_updated_at_2",
// "identif_updated_at_3",
// "identif_user_id_2",
// "identif_user_id_3",
// "identif_user_login_2",
// "identif_user_login_3",
// "identif_user_name_2",
// "identif_user_name_3",
// "identifications_count",
// "last_indexed_at",
// "latitude",
// "location_is_exact",
// "longitude",
// "map_scale",
// "mappable",
// "num_identification_agreements",
// "num_identification_disagreements",
// "oauth_application_id",
// "observation_photos_count",
// "observation_sounds_count",
// "observed_on",
// "observed_on_string",
// "out_of_range",
// "owners_identification_from_vision",
// "photo_attribution_0",
// "photo_attribution_1",
// "photo_attribution_2",
// "photo_attribution_3",
// "photo_attribution_4",
// "photo_attribution_5",
// "photo_attribution_6",
// "photo_id_0",
// "photo_id_1",
// "photo_id_2",
// "photo_id_3",
// "photo_id_4",
// "photo_id_5",
// "photo_id_6",
// "photo_large_url_0",
// "photo_large_url_1",
// "photo_large_url_2",
// "photo_large_url_3",
// "photo_large_url_4",
// "photo_large_url_5",
// "photo_large_url_6",
// "place_guess",
// "positional_accuracy",
// "positioning_device",
// "positioning_method",
// "project_id_0",
// "project_id_1",
// "project_id_2",
// "project_id_3",
// "project_title_0",
// "project_title_1",
// "project_title_2",
// "project_title_3",
// "public_positional_accuracy",
// "quality_grade",
// "site_id",
// "species_guess",
// "taxon_geoprivacy",
// "taxon_id",
// "taxon_name",
// "taxon_rank",
// "time_observed_at",
// "time_observed_at_utc",
// "time_zone",
// "updated_at",
// "updated_at_utc",
// "uri",
// "user_id",
// "user_login",
// "usuario externo",
// "uuid",
// "zic_time_zone"
// ];

// CONSTANTS
const natusferaBaseUrl = "https://natusfera.gbif.es";
const staBaseUrl = "http://localhost:8080/sta";
const emptyUOM = {
  name: null,
  symbol: null,
  definition: null
};


try {
  const filePath = "./RitmeNatura_odc.csv";
  fs.exists(filePath, exists => {
    if (!exists) {
      superagent.get("https://external.opengeospatial.org/twiki_public/pub/CitSciIE/OpenDataChallenge/RitmeNatura_odc.csv")
                .set("user-agent", "some-agent")
                .set("accept", "*/*; charset=utf-8")
                .end((err, res) => fs.writeFileSync(filePath, res.text, (err) => {
                  if (err) throw err;
                }));
    }
  });
  const file = fs.readFileSync(filePath);
  
  const output = [];
  parse(file, {
    columns: true,
    delimiter: ";",
    trim: true
  }, function(err, data) {
    data.forEach(data => {
      const record = {
        id: data.id,
        uri: data.uri,
        user_id: data.user_id,
        user_login: data.user_login,
        observation: {
          taxon: {
            observationType: "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation",
            taxon_name: data.taxon_name,
            species_guess: data.species_guess,
            fenofase: data.Fenofase
          },
          //},{
          //  fenofase: {
          //   observedProperty: "fenofase",
          //   observationType: "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation",
          //   phase: data.Fenofase
          // }
        },
        time_observed_at: data.time_observed_at,
        location: createPoint(data)
      };

      record.observation_photos = [];
      for (let i = 0 ; i < data.observation_photos_count ; i++) {
        record.observation_photos.push({
          id: data["photo_id_" + i],
          attribution: data["photo_attribution_" + i],
          url: data["photo_large_url_" + i]
        });
      }

      if (record.user_id) {
        output.push(record);
      }
    });

  }).on("end", async () => {
    createNewThings(output).then(() => createNewObservations(output)).catch(error => console.error(error));
    
  });
} catch (error) {
  console.error(error);
}

function createPoint(data) {
  let lon = parseFloat(data.longitude);
  let lat = parseFloat(data.latitude);
  if (isNaN(lon) || isNaN(lat)) {
    //console.warn("invalid location data (lon: " + data.longitude + ", lat: " + data.latitude + ")");
    lon = 0;
    lat = 0;
  }
  return {
    type: "Point",
    coordinates: [lon, lat]
  }
}

async function createNewThings(output) {
  const sensorsResponse = (await getSensors()).body;
  const citSciSensor = {
    name: "Citizen Scientist",
    description: "Person sharing individual observations to the public for scientific use",
    encodingType: "application/pdf",
    metadata: "https://www.weobserve.eu/cops-glossary/#6af6a6f33a552b418"
  };
  const sensor = sensorsResponse.value.find(sensor => sensor.name === "Citizen Scientist");
  const sensorId = sensor ? sensor["@iot.id"] : (await postSensor(citSciSensor)).body["@iot.id"];

  // observed property
  const observedPropertiesResponse = (await getObservedProperties()).body;
  const taxonObservedProperty = {
    name: "Taxon",
    description: "The canonical name of the observed species",
    definition: "http://purl.org/biodiversity/taxon/"
  };
  const observedProperty = observedPropertiesResponse.value.find(observedProperty => observedProperty.name === "Taxon");
  const observedPropertyId = observedProperty ? observedProperty["@iot.id"] : (await postObservedProperty(taxonObservedProperty)).body["@iot.id"];

  const things = (await getThings()).body;
  const thingNames = things.value.map(thing => thing.name);

  const newThings = {};
  output.forEach(record => {
    if (!newThings[record.id] && !thingNames.includes(record.user_login)) {
      const observation = record.observation.taxon;
      observation.name = "taxon";
      observation.observedPropertyId = observedPropertyId;
      newThings[record.user_id] = createThing(record, sensorId, observation);
    }
  });
  Object.keys(newThings)
        .forEach(user_id => postThing(newThings[user_id]));
}

function createThing(record, sensorId, observation) {
  const user = record.user_login;
  const datastreams = createDatastream(user, sensorId, observation);
  const thing = {
    name: user,
    description: "Citizen Scientist",
    properties: {
      uri: natusferaBaseUrl + "/users/" + record.user_id,
      id: record.user_id
    },
    Datastreams: datastreams
  };
  return thing;
}

function createDatastream(user, sensorId, observation) {
  return [{
    name: "Datastream of user " + user + " (observing " + observation.name + ")",
    description: "An observation datastream taken from a Citizen Scientist via mobile phone",
    observationType: observation.observationType,
    ObservedProperty: {
      "@iot.id": observation.observedPropertyId
    },
    unitOfMeasurement: emptyUOM,
    Sensor: {
      "@iot.id": sensorId
    }
  }];
}

async function createNewObservations(output) {

  const observationsByUserLogin = {};
  output.forEach(record => {
    if (!observationsByUserLogin[record.user_login]) {
      observationsByUserLogin[record.user_login] = [];
    }
    const observations = observationsByUserLogin[record.user_login];
    const speciesObservation = record.observation.taxon;
    /*
      taxon_name: data.taxon_name,
      species_guess: data.species_guess,
      fenofase: data.Fenofase
    */
    const observation = {
      phenomenonTime: record.time_observed_at,
      resultTime: record.time_observed_at,
      result: speciesObservation.taxon_name,
      FeatureOfInterest: {
        name: "observed location",
        description: "insitu location where taxon observation has been made",
        encodingType: "application/vnd.geo+json",
        feature: record.location
      },
      // parameters: [species_guess, fenofase, photos]
    };
    observations.push(observation);

    const location = createLocation(record);
    // update thing location /!\ cannot set time for HistoricalLocations
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

function createLocation(record) {
  return {
    name: "observed location",
    description: "The location where the observation has been made (insitu for now)",
    encodingType: "application/vnd.geo+json",
    location: record.location
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

async function sendGet(url, query) {
  if (query) {
    console.log("GETting: " + url + " and query " + JSON.stringify(query, null, 2));
  } else {
    console.log("GETting: " + url);
  }
  const request = superagent.get(url)
                            .set("content-type", "application/json; charset=utf-8")
                            .set("accept", "application/json");
  if (query) {
    request.query(query);
  }
  return request.catch(error => {
      const response = error.response;
      const request = response.req;
      console.error("errornous request: " + JSON.stringify(request, null, 2));
    });
}

async function postSensor(sensor) {
  return sendPost(staBaseUrl + "/Sensors", sensor);
}

async function postObservedProperty(observedProperty) {
  return sendPost(staBaseUrl + "/ObservedProperties", observedProperty);
}

function postThing(thing) {
  sendPost(staBaseUrl + "/Things", thing);
}

async function sendPost(url, payload) {
  console.log("POSTing to: " + url + "\n", JSON.stringify(payload, null, 2));
  return superagent.post(url)
    .send(payload)
    .set("content-type", "application/json; charset=utf-8")
    .set("accept", "application/json")
    .catch(error => {
      const response = error.response;
      console.error(JSON.stringify(response, null, 2));
    });
}
