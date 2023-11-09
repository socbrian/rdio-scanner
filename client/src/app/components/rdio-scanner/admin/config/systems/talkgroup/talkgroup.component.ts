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

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { RdioScannerAdminService, Group, Tag } from '../../../admin.service';

@Component({
    selector: 'rdio-scanner-admin-talkgroup',
    templateUrl: './talkgroup.component.html',
})
export class RdioScannerAdminTalkgroupComponent {
    private adminService = inject(RdioScannerAdminService)

    @Input() form: UntypedFormGroup | undefined;

    @Output() blacklist = new EventEmitter<void>();

    @Output() remove = new EventEmitter<void>();

    get led(): UntypedFormControl {
        return this.form?.get('led') as UntypedFormControl;
    }

    get groups(): Group[] {
        return this.form?.root.get('groups')?.value as Group[];
    }

    get tags(): Tag[] {
        return this.form?.root.get('tags')?.value as Tag[];
    }
}
