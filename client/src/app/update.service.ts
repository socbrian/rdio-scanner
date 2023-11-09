import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

import { MatSnackBar } from '@angular/material/snack-bar';

import { first } from 'rxjs/operators';
import { concat, interval } from 'rxjs';

@Injectable()
export class AppUpdateService {
    private ngSwUpdate = inject(SwUpdate);
    private matSnackBar = inject(MatSnackBar);
    private ngAppRef = inject(ApplicationRef);
    private subscribed = false;

    constructor() {
    }

    checkForUpdates(): void {
        this.ngSwUpdate.activateUpdate().then(() => {
            this.matSnackBar.open('Checking for update', '', { duration: 1000 });
        });
        if (this.ngSwUpdate.isEnabled && !this.subscribed) {
            concat(
                this.ngAppRef.isStable.pipe(first((stable) => stable === true)),
                interval(5 * 60 * 1000),
            ).subscribe(() => this.ngSwUpdate.checkForUpdate());

            this.ngSwUpdate.versionUpdates.subscribe((event: VersionEvent) => {
                if (event.type === 'VERSION_READY') {
                    this.ngSwUpdate.activateUpdate().then(() => {
                        this.matSnackBar.open('Frontend updated, reloading...', '', { duration: 3000 });
                        setTimeout(() => document.location.reload(), 3000);
                    });
                }
            });
            this.subscribed = true;
        }
    }
}
