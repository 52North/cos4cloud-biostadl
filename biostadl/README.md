# Data Loader

This node module downloads a CSV file containing some example
citizen science data which was exported once for the OGC Citizen
Science Interoperability Experiment.

COS4CLOUD is developing an extension for the Sensor
Things API (STA) to leverage essential workflows within citizen science.
The data loader therefore downloads and parses the data to feeds it into a Sensor Things API having enabled the citizen science extension.

**Note:** This is just a helper tool to load example data to the STA.

## Configure

The module POSTs all parsed data to an unprotected API. By default the STA API endpoint is <http://localhost:8080/sta>. This can be changed under `src/config/Config.ts`.

## Build

Compiles the whole module

```sh
npm run build
```

Output compiled files can be found under `out`.

## Watch

Run continuous typescript compilation

```sh
npm run watch
```

## Run

The loader can be run by

```sh
node out/index.js
```

## Loading Semantics

The data loader tries to load as much data as possible available from CSV example data. However,
it loading follows some rules:

* License is just guessed from the `attribution` column
* A fixed set of license will be loaded to the STA:
  * all CC licenses
  * MIT license
* Photo-Observations where no guess can be associated to a known licenses will be ignored
* Only the first project will be associated to a datastream 
