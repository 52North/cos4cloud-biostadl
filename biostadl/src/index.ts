import CitSciDataProvider from "./app/CitSciIEDataProvider";
import CSVReader from "./app/CSVReader";
import old_apprach from "./app/old_approach"
import RecordParser from "./app/RecordParser";
import { staBaseUrl } from "./config/Config";
import { Record } from "./app/record_types";
import STA from "./sta/sta_service";
import { StaDataLoader } from "./sta/StaDataLoader";

const data = new CitSciDataProvider();
const csvReader = new CSVReader(data);
csvReader.readCSVData(async (data: any) => {
    const sta = new STA(staBaseUrl);
    const parser = new RecordParser();
    const loader = new StaDataLoader(sta);
    loader.load(parser.parseRecords(data));
});
