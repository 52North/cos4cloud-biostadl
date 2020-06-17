import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from './../../services/auth.service';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  public isAuthenticated: Observable<boolean>;

  constructor(
    private authSrvc: AuthService
  ) {
    this.isAuthenticated = authSrvc.isAuthenticated$;
  }

  get userName(): string {
    const claims = this.authSrvc.identityClaims;
    if (!claims) { return null; }
    return `${claims['given_name']} ${claims['family_name']}`;
  }

  get expirationDate(): string {
    const claims = this.authSrvc.identityClaims;
    return new Date(claims['exp'] * 1000).toLocaleString();
  }

  login() {
    this.authSrvc.login();
  }

  logout() {
    this.authSrvc.logout();
  }

}
