
import superagent from "superagent";
import fs from 'fs';

export interface DataProvider {
    loadData(): Promise<any>;
}

export class DataDownloader {

    async get(url: string, filePath: string) {
        if (!fs.existsSync(filePath)) {
            const response = await superagent.get(url)
                .set("user-agent", "some-agent")
                .set("accept", "*/*; charset=utf-8")
            fs.writeFileSync(filePath, response.text, "utf-8");
        }
        return fs.readFileSync(filePath, "utf-8");
    }
}