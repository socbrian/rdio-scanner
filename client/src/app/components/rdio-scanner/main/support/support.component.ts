/*
 * *****************************************************************************
 * Copyright (C) 2019-2022 Chrystian Huot <chrystian.huot@saubeo.solutions>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 * ****************************************************************************
 */

import { Component, Inject, Optional, inject } from '@angular/core';
import { MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA, MatLegacySnackBarRef as MatSnackBarRef } from '@angular/material/legacy-snack-bar';
import { timer } from 'rxjs';

@Component({
    selector: 'RdioScannerSupport',
    styleUrls: ['./support.component.scss'],
    templateUrl: './support.component.html',
})
export class RdioScannerSupportComponent {
    private matSnackBarRef = inject(MatSnackBarRef<RdioScannerSupportComponent>);
    @Inject(MAT_SNACK_BAR_DATA)
    public data: { email: string } | undefined;

    countdown = 10;

    email: string | undefined;

    constructor() {
        this.email = this.data?.email;

        this.wait();
    }

    private wait(): void {
        timer(1000).subscribe(() => {
            this.countdown--;

            if (this.countdown < 1) {
                this.matSnackBarRef?.dismiss();

            } else {
                this.wait();
            }
        });
    }
}