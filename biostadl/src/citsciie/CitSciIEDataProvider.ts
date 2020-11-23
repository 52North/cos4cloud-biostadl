
import fs from 'fs';
import tmp from "tmp";
import path from "path";
import superagent from "superagent";
import {DataProvider} from "./CSVReader"

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
        return await this._loadData(url, filepath);
    }

    async _loadData(url:string, filePath:string) {
        if (!fs.existsSync(filePath)) {
            const response = await superagent.get(url)
                .set("user-agent", "some-agent")
                .set("accept", "*/*; charset=utf-8")
            fs.writeFileSync(filePath, response.text, "utf-8");
        }
        return fs.readFileSync(filePath, "utf-8");
    }

}
