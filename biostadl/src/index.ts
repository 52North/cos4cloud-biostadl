import CitSciDataProvider from "./citsciie/CitSciIEDataProvider";
import CSVReader from "./citsciie/CSVReader";
import RecordParser from "./citsciie/RecordParser";
import { staBaseUrl } from "./config/Config";
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
