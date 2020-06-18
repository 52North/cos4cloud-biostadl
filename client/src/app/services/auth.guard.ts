import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authSrvc: AuthService
        // private oauthService: OAuthService
    ) { }

    canActivate() {
        debugger;
        if (
            this.authSrvc.accessToken
            // this.oauthService.hasValidAccessToken() &&
            // this.oauthService.hasValidIdToken()
        ) {
            return true;
        } else {
            this.router.navigate(['/login', { login: true }]);
            return false;
        }
    }
}