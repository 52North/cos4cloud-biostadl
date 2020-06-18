import { Component, OnInit } from '@angular/core';
import { StaReadInterfaceService } from '@helgoland/core';
import { MapCache } from '@helgoland/map';
import * as L from 'leaflet';
import { Observable } from 'rxjs';

import { AuthService } from './../../services/auth.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  public geometry: GeoJSON.GeoJsonObject;

  public authenticated: Observable<boolean>;

  constructor(
    private mapCache: MapCache,
    private authSrvc: AuthService,
    private sta: StaReadInterfaceService
  ) { }

  ngOnInit() {
    this.authenticated = this.authSrvc.isAuthenticated$;

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

    console.log(this.authSrvc.accessToken);

    this.sta.getLocations('https://cos4cloud.demo.52north.org/sta/').subscribe(res => {
      debugger;
    });

  }

}
