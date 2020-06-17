import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HelgolandCoreModule } from '@helgoland/core';
import { HelgolandMapViewModule } from '@helgoland/map';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './pages/map/map.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HelgolandCoreModule,
    HelgolandMapViewModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
