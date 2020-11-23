

import tmp from "tmp";
import path from "path";
import superagent from "superagent";
import { DataDownloader, DataProvider } from '../common/DataDownloader';

export default class CitSciDataProvider implements DataProvider {

    tmpDir: string;

    constructor(filepath?: string) {
        const tmpDir = filepath ?? tmp.dirSync({prefix: "biostadl"}).name;
        this.tmpDir = tmpDir;
    }

    async loadData(): Promise<any> {
        const filename = "RitmeNatura_odc.csv";
        const filepath = path.resolve(this.tmpDir, filename);
        const url = `https://external.opengeospatial.org/twiki_public/pub/CitSciIE/OpenDataChallenge/${filename}`;
        const downloader = new DataDownloader();
        return await downloader.get(url, filepath);
    }

}
