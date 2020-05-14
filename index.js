const fs = require('fs')
const https = require('https');
const superagent = require("superagent");
const parse = require('csv-parse');

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

// superagent.get("https://external.opengeospatial.org/twiki_public/pub/CitSciIE/OpenDataChallenge/RitmeNatura_odc.csv")
//           .set("user-agent", "some-agent")
//           .set("accept", "*/*; charset=utf-8")
//           .end((err, res) => {
//              const data = res.text;
fs.readFile('./RitmeNatura_odc.csv', (err, data) => {
            if (err) {
                console.log(err);
            } else {
              const output = [];
              parse(data, {
                columns: true,
                delimiter: ";",
                trim: true
              }, function(err, data){
                data.forEach(data => {
                  const record = {
                    id: data.id,
                    uri: data.uri,
                    species_guess: data.species_guess,
                    time_observed_at: data.time_observed_at,
                    fenofase: data.Fenofase,
                    user_id: data.user_id,
                    user_login: data.user_login,
                    taxon_name: data.taxon_name
                  };

                  record.observation_photos = [];
                  for (i = 0 ; i < data.observation_photos_count ; i++) {
                    record.observation_photos.push({
                      id: data["photo_id_" + i],
                      attribution: data["photo_attribution_" + i],
                      url: data["photo_large_url_" + i],
                    });
                  }
                  output.push(record);
                });
              }).on("end", () => {
                console.log(output);
                console.log("finished");
              });
            }
          });
