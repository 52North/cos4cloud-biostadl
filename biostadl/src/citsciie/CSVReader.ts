import fs from 'fs';
import tmp from "tmp";
import path from "path";
import parseCSV from 'csv-parse';
import { DataProvider } from '../common/DataDownloader';

export default class CSVReader {
    
    dataProvider: DataProvider;

    constructor(dataProvider: DataProvider) {
        this.dataProvider = dataProvider;
    }

    async readCSVData(onData: (data: any) => void): Promise<any> {
        const data = await this.dataProvider.loadData();
        return await this._readCSV(data, onData);
    }

    async _readCSV(csv: string | Buffer, onData: (data: any) => void) {
        parseCSV(csv, {
            skip_empty_lines: true,
            columns: true,
            delimiter: ";",
            trim: true
        }, (err: any, data: any) => {
            if (err) {
                throw new Error(`loading data failed: ${err}`);
            }
            onData(data);
        });
    }
}