'use strict';

// const assert = require('chai').assert;
// const DataLoader = require("../build/CitSciIEDataLoader");

import chai from 'chai';
import { DataProvider } from "./CSVReader"
import RecordParser from "./RecordParser";
import { Record } from "./record_types";

import 'mocha';
import { features } from 'process';

const assert = chai.assert;

describe('Parse records', function () {

    it('should parse no data to empty records', function () {
        const parser = new RecordParser();
        assert.deepEqual(parser.parseRecords([]), []);
    });

    it('should parse FeatureOfInterest', function () {
        const feature = RecordParser.createFeature({
            id: 42,
            longitude: 2.45,
            latitude: 51.7
        });
        assert.equal(feature.encodingType, "application/vnd.geo+json");
        assert.deepEqual(feature.feature, {
            type: 'Point',
            coordinates: [2.45, 51.7]
        });
    });

    it('should ignore records with duplicated id', function () {
        const parser = new RecordParser();
        const records = parser.parseRecords([
            {
                id: 42,
                species_guess: "species",
                longitude: 2.45,
                latitude: 51.7
            }, {
                id: 42,
                species_guess: "not_relevant",
                longitude: 2.45,
                latitude: 51.7
            }]);
        assert.equal(records.length, 1);
        assert.equal(records[0].observations[0].result, "species");
    });

    it('should ignore records missing coordinate', function () {
        const parser = new RecordParser();
        const records = parser.parseRecords([{
            id: 42
        }]);
        assert.deepEqual(records, []);
    });

    it('should parse historical location from record', function () {
        const parser = new RecordParser();
        const records = parser.parseRecords([{
            id: 42,
            longitude: 2.45,
            latitude: 51.7
        }]);
        const record = records[0];
        const feature = record.feature;
        const histLoc = RecordParser.createHistoricalLocation(record);
        const location = histLoc?.Locations[0];
        assert.equal(location.location, feature.feature);
        assert.equal(histLoc.Thing, undefined);
    });

    it('should parse historical location with thing reference', function () {
        const parser = new RecordParser();
        const records = parser.parseRecords([{
            id: 42,
            longitude: 2.45,
            latitude: 51.7
        }]);
        const record = records[0];
        const feature = record.feature;
        const histLoc = RecordParser.createHistoricalLocation(record, "42");
        const location = histLoc?.Locations[0];
        assert.deepEqual(histLoc.Thing, { "@iot.id": "42" });
    });
});
