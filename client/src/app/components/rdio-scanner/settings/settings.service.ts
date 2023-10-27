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

import { Injectable } from '@angular/core';

const SETTINGS_LOCALSTORAGE_KEY = 'rdio-scanner-settings';

@Injectable()
export class RdioScannerSettingsService {
    public get disableBeep(): boolean {
        return this.getItem('disableBeep') === '1';
    }

    public set disableBeep(disableBeep: boolean) {
        this.setItem('disableBeep', disableBeep ? '1' : '0');
    }

    public get startFeedAutomatically(): boolean {
        return this.getItem('startFeedAutomatically') === '1';
    }

    public set startFeedAutomatically(startFeedAutomatically: boolean) {
        this.setItem('startFeedAutomatically', startFeedAutomatically ? '1' : '0');
    }

    private getItem(key: string): string | null {
        return window?.localStorage?.getItem(SETTINGS_LOCALSTORAGE_KEY + '_' + key);
    }

    private setItem(key: string, value: string): void {
        window?.localStorage?.setItem(SETTINGS_LOCALSTORAGE_KEY + '_' + key, value);
    }
}
