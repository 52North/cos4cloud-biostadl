import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HelgolandCoreModule } from '@helgoland/core';
import { HelgolandMapViewModule } from '@helgoland/map';
import { OAuthModule } from 'angular-oauth2-oidc';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { MapComponent } from './pages/map/map.component';
import { AuthGuard } from './services/auth.guard';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ToolbarComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HelgolandCoreModule,
    HelgolandMapViewModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    OAuthModule.forRoot(
      {
        resourceServer: {
          sendAccessToken: true,
          allowedUrls: ['https://cos4cloud.demo.52north.org/sta/']
        }
      }
    ),
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
