import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CloudAppEventsService,
  CloudAppRestService
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';

type Mode = 'scan' | 'set' | 'selected';

interface AlmaEntity {
  id?: string;
  type?: string;
  description?: string;
  link?: string;
}

interface AlmaSet {
  id: string;
  name: string;
}

interface LabelItem {
  pid: string;
  barcode: string;
  callNumber: string;
  lines: string[];
  checked: boolean;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  mode: Mode = 'scan';
  step: 1 | 2 = 1;

  barcode = '';
  items: LabelItem[] = [];

  pageEntities: AlmaEntity[] = [];
  selectedEntities: AlmaEntity[] = [];
  entitySelection = new Set<string>();

  sets: AlmaSet[] = [];
  selectedSetId = '';

  loading = false;
  loadingSets = false;
  resultMessage = '';
  errorMessage = '';

  private entitiesSubscription?: Subscription;

  constructor(
    private eventsService: CloudAppEventsService,
    private restService: CloudAppRestService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.entitiesSubscription = this.eventsService.entities$.subscribe(
      (entities: any[]) => {
        this.pageEntities = (entities || []).filter(
          entity => String(entity?.type || '').toUpperCase() === 'ITEM'
        );
        this.selectedEntities = this.pageEntities;
        this.entitySelection.clear();
        for (const entity of this.selectedEntities) {
          this.entitySelection.add(this.entityKey(entity));
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.entitiesSubscription?.unsubscribe();
  }

  async changeMode(mode: Mode): Promise<void> {
    this.mode = mode;
    this.errorMessage = '';
    this.resultMessage = '';

    if (mode === 'set' && !this.sets.length) {
      await this.loadSets();
    }
  }

  async addBarcode(): Promise<void> {
    const barcode = this.barcode.trim();
    this.errorMessage = '';
    this.resultMessage = '';

    if (!barcode) {
      this.errorMessage = this.t('Errors.BarcodeRequired');
      return;
    }

    this.loading = true;
    try {
      const item = await this.getItemByBarcode(barcode);
      this.addItem(item);
      this.barcode = '';
    } catch (error) {
      console.error(error);
      this.errorMessage = this.t('Errors.BarcodeLoad');
    } finally {
      this.loading = false;
    }
  }

  async loadSets(): Promise<void> {
    this.loadingSets = true;
    this.errorMessage = '';

    try {
      const result: AlmaSet[] = [];
      let offset = 0;

      while (true) {
        const response: any = await firstValueFrom(
          this.restService.call(
            `/conf/sets?content_type=ITEM&set_type=ITEMIZED&limit=100&offset=${offset}&format=json`
          )
        );

        const list = this.arrayOf(response?.set ?? response?.sets?.set);
        for (const set of list) {
          const id = this.value(set?.id);
          const name = this.value(set?.name);
          if (id && name) result.push({ id, name });
        }

        const total = Number(
          response?.total_record_count ??
          response?.sets?.total_record_count ??
          result.length
        );

        if (list.length < 100 || result.length >= total) break;
        offset += list.length;
      }

      this.sets = result.sort((a, b) =>
        a.name.localeCompare(b.name, this.currentLang(), {
          numeric: true,
          sensitivity: 'base'
        })
      );
    } catch (error) {
      console.error(error);
      this.errorMessage = this.t('Errors.SetLoad');
    } finally {
      this.loadingSets = false;
    }
  }

  async loadSelectedSet(): Promise<void> {
    this.errorMessage = '';
    this.resultMessage = '';

    if (!this.selectedSetId) {
      this.errorMessage = this.t('Errors.SetRequired');
      return;
    }

    this.loading = true;
    try {
      const barcodes: string[] = [];
      let offset = 0;

      while (true) {
        const response: any = await firstValueFrom(
          this.restService.call(
            `/conf/sets/${encodeURIComponent(this.selectedSetId)}/members?limit=100&offset=${offset}&format=json`
          )
        );

        const list = this.arrayOf(
          response?.member ?? response?.members?.member
        );

        for (const member of list) {
          const barcode = this.value(member?.description);
          if (barcode) barcodes.push(barcode);
        }

        const total = Number(
          response?.total_record_count ??
          response?.members?.total_record_count ??
          barcodes.length
        );

        if (list.length < 100 || barcodes.length >= total) break;
        offset += list.length;
      }

      for (const barcode of barcodes) {
        try {
          const item = await this.getItemByBarcode(barcode);
          this.addItem(item, false);
        } catch (error) {
          console.error('Could not load set member', barcode, error);
        }
      }
    } catch (error) {
      console.error(error);
      this.errorMessage = this.t('Errors.SetLoad');
    } finally {
      this.loading = false;
    }
  }

  toggleEntity(entity: AlmaEntity): void {
    const key = this.entityKey(entity);
    if (this.entitySelection.has(key)) {
      this.entitySelection.delete(key);
    } else {
      this.entitySelection.add(key);
    }
  }

  entityChecked(entity: AlmaEntity): boolean {
    return this.entitySelection.has(this.entityKey(entity));
  }

  toggleAllEntities(): void {
    if (
      this.selectedEntities.length &&
      this.entitySelection.size === this.selectedEntities.length
    ) {
      this.entitySelection.clear();
      return;
    }

    this.entitySelection.clear();
    for (const entity of this.selectedEntities) {
      this.entitySelection.add(this.entityKey(entity));
    }
  }

  async loadSelectedEntities(): Promise<void> {
    this.errorMessage = '';
    this.resultMessage = '';

    const entities = this.selectedEntities.filter(
      entity => this.entityChecked(entity)
    );

    if (!entities.length) {
      this.errorMessage = this.t('Errors.NothingSelected');
      return;
    }

    this.loading = true;
    let failed = 0;

    try {
      for (const entity of entities) {
        if (!entity.link) {
          failed++;
          continue;
        }

        try {
          const separator = entity.link.includes('?') ? '&' : '?';
          const item: any = await firstValueFrom(
            this.restService.call(
              `${entity.link}${separator}view=label&format=json`
            )
          );
          this.addItem(item, false);
        } catch (error) {
          console.error('Could not load selected item', entity, error);
          failed++;
        }
      }

      if (failed) {
        this.errorMessage = this.t('Errors.ItemLoad');
      }
    } finally {
      this.loading = false;
    }
  }

  removeItem(item: LabelItem): void {
    this.items = this.items.filter(x => x.pid !== item.pid);
  }

  toggleAllItems(): void {
    const allChecked = this.items.length > 0 && this.items.every(x => x.checked);
    this.items = this.items.map(item => ({
      ...item,
      checked: !allChecked
    }));
  }

  get checkedItems(): LabelItem[] {
    return this.items.filter(item => item.checked);
  }

  get allItemsChecked(): boolean {
    return this.items.length > 0 && this.items.every(item => item.checked);
  }

  async next(): Promise<void> {
    this.errorMessage = '';

    if (this.mode === 'selected') {
      await this.loadSelectedEntities();
    } else if (this.mode === 'set' && this.selectedSetId && !this.items.length) {
      await this.loadSelectedSet();
    }

    if (!this.checkedItems.length) {
      this.errorMessage = this.t('Errors.NothingSelected');
      return;
    }

    this.step = 2;
  }

  back(): void {
    this.step = 1;
  }

  print(): void {
    const labels = this.checkedItems;
    if (!labels.length) return;

    this.errorMessage = '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.errorMessage = this.t('Errors.Popup');
      return;
    }

    const labelsHtml = labels.map((item, index) => `
      <section class="label${index === labels.length - 1 ? ' last' : ''}">
        ${item.lines.length
          ? item.lines.map(line => `<div>${this.escapeHtml(line)}</div>`).join('')
          : `<div>${this.escapeHtml(this.t('Main.NoCallNumber'))}</div>`}
      </section>
    `).join('');

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${this.escapeHtml(this.t('Main.Title'))}</title>
<style>
  @page { margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
  }
  .screen-only {
    padding: 8px;
    text-align: right;
  }
  .screen-only button {
    font: 14px Arial, sans-serif;
    padding: 6px 12px;
  }
  .label {
    margin: 0;
    padding: 2mm;
    font-size: 12pt;
    line-height: 1.05;
    font-weight: 700;
    break-after: page;
    page-break-after: always;
  }
  .label.last {
    break-after: auto;
    page-break-after: auto;
  }
  @media print {
    .screen-only { display: none !important; }
  }
</style>
</head>
<body>
<div class="screen-only">
  <button id="print-button" type="button">${this.escapeHtml(this.t('Main.Print'))}</button>
</div>
${labelsHtml}
</body>
</html>`);
    printWindow.document.close();

    printWindow.document
      .getElementById('print-button')
      ?.addEventListener('click', () => {
        printWindow.focus();
        printWindow.print();
      });

    setTimeout(() => printWindow.focus(), 100);
    this.resultMessage = this.t('Main.PrintReady');
  }

  private async getItemByBarcode(barcode: string): Promise<any> {
    return await firstValueFrom(
      this.restService.call(
        `/items?item_barcode=${encodeURIComponent(barcode)}&view=label&format=json`
      )
    );
  }

  private addItem(raw: any, showDuplicate = true): void {
    const item = this.normalizeItem(raw);
    if (!item.pid && !item.barcode) {
      throw new Error('Invalid item');
    }

    if (
      this.items.some(
        existing =>
          (item.pid && existing.pid === item.pid) ||
          (item.barcode && existing.barcode === item.barcode)
      )
    ) {
      if (showDuplicate) {
        this.errorMessage = this.t('Errors.Duplicate');
      }
      return;
    }

    this.items = [...this.items, item];
  }

  private normalizeItem(raw: any): LabelItem {
    const pid = this.value(raw?.item_data?.pid);
    const barcode = this.value(raw?.item_data?.barcode);

    const callNumber =
      this.value(raw?.holding_data?.call_number) ||
      this.value(raw?.holding_data?.permanent_call_number) ||
      this.parsedCallNumber(raw?.parsed_call_number) ||
      this.value(raw?.item_data?.alternative_call_number);

    return {
      pid: pid || barcode,
      barcode,
      callNumber,
      lines: this.splitCallNumber(callNumber),
      checked: true
    };
  }

  private parsedCallNumber(value: any): string {
    const list = this.arrayOf(value?.call_no);
    return list.map(item => this.value(item)).filter(Boolean).join(' ');
  }

  splitCallNumber(value: string): string[] {
    return String(value || '')
      .trim()
      .split(/\s+/)
      .map(part => part.trim())
      .filter(Boolean);
  }

  private entityKey(entity: AlmaEntity): string {
    return String(entity.id || entity.link || entity.description || '');
  }

  private value(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return String(value.value ?? value.desc ?? value._ ?? '').trim();
    }
    return String(value).trim();
  }

  private arrayOf(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private currentLang(): string {
    return String(
      this.translate.currentLang ||
      this.translate.defaultLang ||
      'en'
    ).toLowerCase().split('-')[0];
  }

  private t(key: string, params?: Record<string, any>): string {
    return this.translate.instant(key, params);
  }

  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
