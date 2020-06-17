import { Component, OnInit } from '@angular/core';
import { MapCache } from '@helgoland/map';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  public geometry: GeoJSON.GeoJsonObject;

  constructor(
    private mapCache: MapCache
  ) { }

  ngOnInit() {
    this.geometry = {
      type: 'Point',
      coordinates: [7.652, 51.935]
    } as GeoJSON.Point;
  }

  mapInitialized(mapId: string) {
    const map = this.mapCache.getMap(mapId);

    const layer = L.geoJSON().addTo(map);
    layer.addData(this.geometry);

    const center = layer.getBounds().getCenter();

    map.setView(center, 15);
  }

}
