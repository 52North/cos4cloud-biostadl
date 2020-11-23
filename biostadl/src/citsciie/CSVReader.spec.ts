'use strict';

// const assert = require('chai').assert;
// const DataLoader = require("../build/CitSciIEDataLoader");

import chai from 'chai';
import RecordParser from "./RecordParser";
import CSVReader from "./CSVReader";

import 'mocha';
import { DataProvider } from '../common/DataDownloader';

const assert = chai.assert;

describe('Read CSV', function () {
    it('respect header', function () {
        const data: DataProvider = {
            loadData: async () => `
            Col_1;Col_2
            my;first-record
            a;second-record`
        }
        const reader = new CSVReader(data);
        reader.readCSVData((data) => {
            assert.lengthOf(data, 2);
        });
    });
});
