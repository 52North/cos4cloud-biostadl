# BioStaDL -- Biodiversity for SensorThings API Data Loader

This software is a helper tool to load biodiversity data to a running SensorThing API.
Data is collected by citizen observatories.

The main goal is to gain an idea and provide a discussion base for how biodiversity data
(collected by citizen scientist) can be modeled in a standardized way (here: using the
OGC SensorThings API)

## Important Notice

The work is under continuous progress. There are no plans yet to raise this tool to a
higher (or even production) level!

The tool is licensed under [MIT license](LICENSE). Use it for free on your own risk.

## Intent

* Map citizen science observation data to SensorThings API data model
* Use the API as a base to integrate citizen science observations with other tools
* Create a playground to get a feeling for the mapping

## What the tool does

* Downloading a sample data set of biodiversity data (CSV, CitSciIE data challenge)
* Process the data to be able to load it into a service instance providing a SensorThing API
* Load biodiversity data to SensorThings API

## Limitations/TODOs

* Security issues (to be met via OpenId Connect)
* Testing data load via client using standardized interface(s)
* Data loading happens from a fixed sample data set for demonstration reasons

## Background

* COS4CLOUD
