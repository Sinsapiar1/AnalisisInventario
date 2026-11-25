/**
 * Informe para imprimir o guardar como PDF.
 *
 * Genera un documento HTML independiente (estilos e imágenes incluidos) y lo
 * abre en una pestaña nueva. Desde ahí el navegador lo convierte en PDF con
 * texto real: se puede buscar, copiar y pesa muy poco.
 *
 * Alcances: 'negative', 'pallet', 'all' (la tabla de cada pestaña, con los
 * filtros y el orden que haya en pantalla), 'dashboard' y 'complete'.
 */
(function(InventorySystem) {
    'use strict';

    const t = (key, vars) => InventorySystem.I18n.t(key, vars);
    const tn = (key, count, vars) => InventorySystem.I18n.tn(key, count, vars);
    const fmt = n => InventorySystem.Utils.formatNumber(n);

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function num(value, options) {
        const n = Number(value) || 0;
        const negative = n < 0 && !(options && options.plain);
        return '<td class="num' + (negative ? ' neg' : '') + '">' + esc(fmt(n)) + '</td>';
    }

    /* ---------- Estilos del documento ---------- */
    const CSS = `
@page { size: A4; margin: 14mm 12mm 16mm; @bottom-right { content: counter(page) " / " counter(pages); font: 8pt Barlow, "Segoe UI", Arial, sans-serif; color: #5a6875; } }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: Barlow, "Segoe UI", Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #17212b; background: #e9edf0; }
.sheet { max-width: 210mm; margin: 0 auto; background: #fff; padding: 14mm 12mm; }
h1, h2, h3 { font-family: "Barlow Semi Condensed", Barlow, "Segoe UI", Arial, sans-serif; font-weight: 600; line-height: 1.2; }

.toolbar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 10px 16px; background: #17212b; color: #fff; border-bottom: 3px solid #f0a202; font-size: 14px; }
.toolbar p { margin-right: auto; color: #c9d2da; }
.toolbar button { font: 600 14px Barlow, "Segoe UI", Arial, sans-serif; padding: 9px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; cursor: pointer; }
.toolbar button:hover { background: rgba(255,255,255,.1); }
.toolbar button.primary { background: #f0a202; border-color: #f0a202; color: #17212b; }
.toolbar button.primary:hover { background: #ffb81f; }
.toolbar button:focus-visible { outline: 3px solid #f0a202; outline-offset: 2px; }

.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; padding-bottom: 10px; border-bottom: 3px solid #17212b; }
.head h1 { font-size: 22pt; }
.head .scope { font-size: 11pt; color: #5a6875; }
.mark { flex: none; width: 34px; height: 27px; border-top: 6px solid #f0a202; border-bottom: 6px solid #f0a202; background: linear-gradient(90deg, #f0a202 0 6px, transparent 6px 14px, #f0a202 14px 20px, transparent 20px 28px, #f0a202 28px 34px); }
.meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 16px; margin: 10px 0 14px; font-size: 9pt; }
.meta dt { color: #5a6875; }
.meta dd { font-weight: 600; overflow-wrap: anywhere; }
.meta .wide { grid-column: 1 / -1; }

.kpis { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #d7dde3; border-radius: 4px; margin-bottom: 12px; }
.kpis.six { grid-template-columns: repeat(6, 1fr); }
.kpi { padding: 7px 10px; border-left: 1px solid #d7dde3; }
.kpi:first-child { border-left: 0; }
.kpi dt { font-size: 8pt; color: #5a6875; }
.kpi dd { font: 600 15pt "Barlow Semi Condensed", Barlow, "Segoe UI", Arial, sans-serif; font-variant-numeric: tabular-nums; }
.kpi.bad { background: #fdeceb; }
.kpi.bad dd { color: #c4281c; }

section { margin-top: 16px; }
section > h2 { font-size: 13pt; padding-bottom: 4px; margin-bottom: 8px; border-bottom: 1px solid #17212b; break-after: avoid; }
.note { font-size: 8.5pt; color: #5a6875; margin: -4px 0 8px; }
.note.closing { margin: 14px 0 0; }

.findings { list-style: none; }
.findings li { padding: 6px 10px; margin-bottom: 5px; border-left: 4px solid #8693a0; background: #f6f8f9; break-inside: avoid; }
.findings .bad { border-left-color: #c4281c; background: #fdeceb; font-weight: 600; }
.findings .warn { border-left-color: #f0a202; background: #fff4d6; }
.findings .ok { border-left-color: #1d7a4c; background: #e4f4ec; }

.ranks { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
.rank { break-inside: avoid; }
.rank h3 { font-size: 10.5pt; margin-bottom: 4px; }
.rank table { font-size: 8.5pt; }
.rank td { padding: 2px 4px; border-bottom: 0; }
.rank td.name { width: 60%; max-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank td.bar { width: 20%; }
.rank .track { display: block; height: 7px; background: #e8ecef; }
.rank .fill { display: block; height: 100%; background: #2b3946; }
.rank.bad .fill { background: #c4281c; }
.rank.warn .fill { background: #f0a202; }
.rank .more { font-size: 8pt; color: #5a6875; padding: 2px 4px; }

.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.charts figure { border: 1px solid #d7dde3; border-radius: 4px; padding: 6px; break-inside: avoid; }
.charts img { display: block; width: 100%; height: auto; }

table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
thead { display: table-header-group; }
th { text-align: left; font-weight: 600; padding: 5px 6px; background: #17212b; color: #fff; white-space: nowrap; }
td { padding: 2.5px 6px; line-height: 1.25; border-bottom: 1px solid #e8ecef; vertical-align: top; overflow-wrap: anywhere; }
tr { break-inside: avoid; }
tbody tr:nth-child(even) td { background: #f6f8f9; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
th.num { text-align: right; }
.neg { color: #c4281c; font-weight: 600; }
.muted { color: #8693a0; }
tr.product td { font-weight: 600; background: #eef1f3 !important; border-top: 1px solid #c3ccd4; }
tr.sub td { background: #fff !important; }
tr.sub td:first-child { padding-left: 16px; color: #5a6875; }
.empty { padding: 14px; text-align: center; color: #5a6875; background: #f6f8f9; }

.foot { margin-top: 18px; padding-top: 6px; border-top: 1px solid #d7dde3; font-size: 8pt; color: #5a6875; display: flex; justify-content: space-between; gap: 12px; }

@media screen and (max-width: 700px) {
  .sheet { padding: 16px 12px; }
  .meta, .ranks, .charts { grid-template-columns: 1fr; }
  .kpis, .kpis.six { grid-template-columns: 1fr 1fr; }
  .kpi { border-left: 0; border-top: 1px solid #d7dde3; }
  .table-scroll { overflow-x: auto; }
}
@media print {
  body { background: #fff; }
  .toolbar { display: none; }
  .sheet { max-width: none; padding: 0; }
}
`;

    /* ---------- Datos ---------- */

    function summaryData(rows) {
        return InventorySystem.DashboardSummary.compute(rows);
    }

    /**
     * Productos con balance negativo de todo el archivo, con sus registros
     * (misma regla que la pestaña: balance por código + almacén, agrupado por código)
     */
    function allNegativeProducts() {
        const balances = window.productBalances || {};
        const byCode = new Map();
        Object.values(balances).forEach(pair => {
            if (!(pair.totalInventory < 0)) return;
            let product = byCode.get(pair.code);
            if (!product) {
                product = { code: pair.code, name: pair.name, totalNegative: 0, totalAvailable: 0, warehouses: new Set(), pallets: new Set(), records: [] };
                byCode.set(pair.code, product);
            }
            product.totalNegative += pair.totalInventory;
            product.warehouses.add(pair.warehouse);
            (pair.records || []).forEach(record => {
                product.records.push(record);
                product.totalAvailable += Number(record.available) || 0;
                if (record.palletId) product.pallets.add(record.palletId);
            });
        });
        return Array.from(byCode.values())
            .map(product => Object.assign(product, { palletCount: product.pallets.size }))
            .sort((a, b) => a.totalNegative - b.totalNegative);
    }

    function activeFilters(scope) {
        const parts = [];
        const value = id => {
            const element = document.getElementById(id);
            return element ? element.value.trim() : '';
        };
        const ui = InventorySystem.UI;
        let search = '';
        let warehouses = [];

        if (scope === 'negative') {
            search = value('negative-search');
            warehouses = ui.getSelectedNegativeWarehouses();
        } else if (scope === 'pallet') {
            search = value('pallet-search');
        } else if (scope === 'all') {
            search = value('all-search');
            warehouses = ui.getSelectedAllWarehouses();
            const status = value('all-status-filter');
            if (status) parts.push(t('filter.status.' + status));
        }
        if (search) parts.unshift(t('report.filter.search', { text: search }));
        if (warehouses.length > 0) parts.push(t('report.filter.warehouses', { list: warehouses.join(', ') }));
        return parts;
    }

    /* ---------- Bloques HTML ---------- */

    function kpiStrip(items, className) {
        return '<dl class="kpis ' + (className || '') + '">' + items.map(item =>
            '<div class="kpi' + (item.bad ? ' bad' : '') + '"><dt>' + esc(item.label) + '</dt><dd>' + esc(fmt(item.value)) + '</dd></div>'
        ).join('') + '</dl>';
    }

    function mainKpis(rows, data) {
        const pallets = new Set();
        let total = 0;
        rows.forEach(row => {
            total += Number(row.physicalInventory) || 0;
            if (row.palletId) pallets.add(row.palletId);
        });
        return kpiStrip([
            { label: t('stats.negative'), value: data.shortages.length, bad: data.shortages.length > 0 },
            { label: t('report.kpi.rows'), value: rows.length },
            { label: t('stats.physical'), value: total },
            { label: t('stats.pallets'), value: pallets.size }
        ]);
    }

    function summarySection(data) {
        const findings = [];
        if (data.shortages.length === 0) {
            findings.push(['ok', t('dash.find.short_none')]);
        } else {
            findings.push(['bad', tn('dash.find.short', data.shortages.length, { n: fmt(data.shortages.length), units: fmt(data.shortUnits) })]);
        }
        if (data.offsetRows > 0) {
            findings.push(['warn', tn('dash.find.offset', data.offsets.length, { n: fmt(data.offsets.length), rows: fmt(data.offsetRows) })]);
        }
        if (data.noPalletRows > 0) {
            findings.push(['', t('dash.find.noPallet', { rows: fmt(data.noPalletRows), units: fmt(data.noPalletUnits) })]);
        }
        if (data.zeroRows > 0) {
            findings.push(['', t('dash.find.zero', { rows: fmt(data.zeroRows) })]);
        }

        return '<section><h2>' + esc(t('dash.findings')) + '</h2>' +
            '<ul class="findings">' + findings.map(f => '<li class="' + f[0] + '">' + esc(f[1]) + '</li>').join('') + '</ul>' +
            kpiStrip([
                { label: t('dash.kpi.products'), value: data.distinctProducts },
                { label: t('dash.kpi.warehouses'), value: data.warehouseCount },
                { label: t('dash.kpi.negativeUnits'), value: data.shortUnits, bad: data.shortUnits > 0 },
                { label: t('dash.kpi.negativeRows'), value: data.negativeRows },
                { label: t('dash.kpi.reserved'), value: data.reserved },
                { label: t('dash.kpi.onOrder'), value: data.onOrder }
            ], 'six') +
            '</section>';
    }

    function rankBlock(title, tone, items, limit) {
        const visible = items.slice(0, limit);
        let body;
        if (visible.length === 0) {
            body = '<p class="more">' + esc(t('dash.rank.empty')) + '</p>';
        } else {
            const max = Math.max.apply(null, visible.map(item => Math.abs(item.value))) || 1;
            body = '<table><tbody>' + visible.map(item =>
                '<tr><td class="name"><strong>' + esc(item.label) + '</strong> ' + esc(item.sub || '') + '</td>' +
                '<td class="bar"><span class="track"><span class="fill" style="width:' +
                Math.max(1.5, Math.abs(item.value) / max * 100).toFixed(1) + '%"></span></span></td>' +
                num(item.value, { plain: tone !== 'bad' }) + '</tr>'
            ).join('') + '</tbody></table>';
            if (items.length > visible.length) {
                body += '<p class="more">' + esc(t('dash.rank.more', { n: fmt(items.length - visible.length) })) + '</p>';
            }
        }
        return '<div class="rank ' + tone + '"><h3>' + esc(title) + '</h3>' + body + '</div>';
    }

    function rankingsSection(data) {
        const limit = 10;
        return '<section><h2>' + esc(t('report.rankings')) + '</h2><div class="ranks">' +
            rankBlock(t('dash.rank.short'), 'bad', data.shortages.map(i => ({ label: i.code, sub: i.name, value: -i.units })), limit) +
            rankBlock(t('dash.rank.offset'), 'warn', data.offsets.map(i => ({ label: i.code, sub: i.name, value: -i.units })), limit) +
            rankBlock(t('dash.rank.warehouse'), 'stock', data.warehouses.map(i => ({ label: i.name || t('value.noWarehouse'), value: i.units })), limit) +
            rankBlock(t('dash.rank.top'), 'stock', data.topStock.map(i => ({ label: i.code, sub: i.name, value: i.units })), limit) +
            '</div></section>';
    }

    function chartsSection() {
        const figures = [];
        document.querySelectorAll('#dashboard-content .chart-container canvas').forEach(canvas => {
            // Los gráficos ocultos o sin dibujar no se incluyen
            if (!canvas.width || !canvas.height || canvas.offsetParent === null) return;
            try {
                figures.push('<figure><img alt="" src="' + canvas.toDataURL('image/png') + '"></figure>');
            } catch (error) {
                console.warn('No se pudo incluir un gráfico en el informe:', error);
            }
        });
        if (figures.length === 0) return '';
        return '<section><h2>' + esc(t('dash.charts')) + '</h2><div class="charts">' + figures.join('') + '</div></section>';
    }

    function tableSection(title, note, headers, bodyHtml, count) {
        const head = '<thead><tr>' + headers.map(h =>
            '<th' + (h.numeric ? ' class="num"' : '') + '>' + esc(h.label) + '</th>').join('') + '</tr></thead>';
        const content = count === 0
            ? '<p class="empty">' + esc(t('report.empty')) + '</p>'
            : '<div class="table-scroll"><table>' + head + '<tbody>' + bodyHtml + '</tbody></table></div>';
        return '<section><h2>' + esc(title) + '</h2>' +
            (note ? '<p class="note">' + esc(note) + '</p>' : '') + content + '</section>';
    }

    function negativeSection(products, title) {
        const headers = [
            { label: t('col.code') }, { label: t('col.name') }, { label: t('col.warehouse') },
            { label: t('col.palletId') }, { label: t('col.physical'), numeric: true }, { label: t('col.available'), numeric: true }
        ];
        const body = products.map(product => {
            const records = product.records.slice().sort((a, b) =>
                String(a.warehouse || '').localeCompare(String(b.warehouse || ''), 'es', { numeric: true }) ||
                (Number(a.physicalInventory) || 0) - (Number(b.physicalInventory) || 0));
            const palletCount = product.palletCount !== undefined ? product.palletCount : 0;
            return '<tr class="product"><td>' + esc(product.code) + '</td><td>' + esc(product.name || '') + '</td>' +
                '<td>' + esc(Array.from(product.warehouses).sort().join(', ')) + '</td>' +
                '<td>' + esc(tn('count.pallet', palletCount, { n: fmt(palletCount) })) + '</td>' +
                num(product.totalNegative) + num(product.totalAvailable) + '</tr>' +
                records.map(record =>
                    '<tr class="sub"><td></td><td></td><td>' + esc(record.warehouse || t('value.noWarehouse')) + '</td>' +
                    '<td' + (record.palletId ? '' : ' class="muted"') + '>' + esc(record.palletId || t('value.noPallet')) + '</td>' +
                    num(record.physicalInventory) + num(record.available) + '</tr>'
                ).join('');
        }).join('');
        return tableSection(title, t('report.negative.note'), headers, body, products.length);
    }

    function palletSection(pallets, title, note) {
        const headers = [
            { label: t('col.palletId') }, { label: t('col.products'), numeric: true },
            { label: t('col.negativeProducts'), numeric: true }, { label: t('col.totalInventory'), numeric: true }
        ];
        const body = pallets.map(pallet =>
            '<tr><td>' + esc(pallet.palletId) + '</td>' + num(pallet.products.length) +
            '<td class="num' + (pallet.negativeProducts > 0 ? ' neg' : '') + '">' + esc(fmt(pallet.negativeProducts)) + '</td>' +
            num(pallet.totalInventory) + '</tr>'
        ).join('');
        return tableSection(title, note, headers, body, pallets.length);
    }

    function inventorySection(items, title) {
        const headers = [
            { label: t('col.code') }, { label: t('col.name') }, { label: t('col.warehouse') },
            { label: t('col.palletId') }, { label: t('col.physical'), numeric: true }, { label: t('col.available'), numeric: true }
        ];
        const body = items.map(item =>
            '<tr><td>' + esc(item.code) + '</td><td>' + esc(item.name || '') + '</td><td>' + esc(item.warehouse || '') + '</td>' +
            '<td' + (item.palletId ? '' : ' class="muted"') + '>' + esc(item.palletId || t('value.noPallet')) + '</td>' +
            num(item.physicalInventory) + num(item.available) + '</tr>'
        ).join('');
        return tableSection(title, null, headers, body, items.length);
    }

    /* ---------- Documento ---------- */

    const SCOPE_TITLES = {
        negative: 'tabs.negative',
        pallet: 'report.scope.pallet',
        all: 'tabs.all',
        dashboard: 'report.scope.dashboard',
        complete: 'report.scope.complete'
    };

    function build(scope, options) {
        const inventory = InventorySystem.Inventory;
        const rows = inventory.getInventoryData();
        const filtered = inventory.getFilteredData();
        const source = inventory.getSourceInfo ? inventory.getSourceInfo() : null;
        const lastUpdate = inventory.getLastUpdate();
        const data = summaryData(rows);
        const now = new Date();
        const scopeTitle = t(SCOPE_TITLES[scope] || SCOPE_TITLES.complete);
        const filters = activeFilters(scope);

        let body = '';
        if (scope === 'negative') {
            body = mainKpis(rows, data) + negativeSection(filtered.negative || [], t('report.negative.title'));
        } else if (scope === 'pallet') {
            body = mainKpis(rows, data) + palletSection(filtered.pallet || [], t('report.scope.pallet'), null);
        } else if (scope === 'all') {
            body = mainKpis(rows, data) + inventorySection(filtered.all || [], t('tabs.all'));
        } else if (scope === 'dashboard') {
            body = mainKpis(rows, data) + summarySection(data) + rankingsSection(data) + chartsSection();
        } else {
            const pallets = Object.values(inventory.getPalletDetails())
                .filter(pallet => pallet.negativeProducts > 0)
                .sort((a, b) => a.totalInventory - b.totalInventory);
            body = mainKpis(rows, data) + summarySection(data) + rankingsSection(data) + chartsSection() +
                negativeSection(allNegativeProducts(), t('report.negative.title')) +
                palletSection(pallets, t('report.pallets.negative'), t('report.pallets.negative.note')) +
                // El listado fila a fila ocuparía decenas de páginas; tiene su propio informe
                '<p class="note closing">' + esc(t('report.complete.note')) + '</p>';
        }

        const fileName = source && source.fileName ? source.fileName : t('file.saved');
        const dateStamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        // El navegador propone este título como nombre del PDF
        const docTitle = scopeTitle + ' - ' + fileName.replace(/\.[a-z0-9]+$/i, '') + ' - ' + dateStamp;

        const meta = [
            [t('report.meta.file'), fileName],
            [t('report.meta.loaded'), lastUpdate ? InventorySystem.Utils.formatDate(lastUpdate) : '—'],
            [t('report.meta.generated'), InventorySystem.Utils.formatDate(now)]
        ];
        let metaHtml = meta.map(m => '<div><dt>' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>').join('');
        if (filters.length > 0) {
            metaHtml += '<div class="wide"><dt>' + esc(t('report.meta.filters')) + '</dt><dd>' + esc(filters.join(' / ')) + '</dd></div>';
        }

        const script = `
document.getElementById('print').addEventListener('click', function () { window.print(); });
document.getElementById('save').addEventListener('click', function () {
  var blob = new Blob(['<!DOCTYPE html>\\n' + document.documentElement.outerHTML], { type: 'text/html' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = document.title + '.html';
  document.body.appendChild(link); link.click(); link.remove();
});
${options && options.print ? "window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });" : ''}
`;

        return '<!DOCTYPE html>\n<html lang="' + InventorySystem.I18n.getLang() + '"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>' + esc(docTitle) + '</title>' +
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&family=Barlow+Semi+Condensed:wght@600&display=swap">' +
            '<style>' + CSS + '</style></head><body>' +
            '<div class="toolbar"><p>' + esc(t('report.toolbar.hint')) + '</p>' +
            '<button type="button" id="save">' + esc(t('report.toolbar.html')) + '</button>' +
            '<button type="button" id="print" class="primary">' + esc(t('report.toolbar.pdf')) + '</button></div>' +
            '<main class="sheet">' +
            '<header class="head"><div><h1>' + esc(t('report.title')) + '</h1><p class="scope">' + esc(scopeTitle) + '</p></div><span class="mark"></span></header>' +
            '<dl class="meta">' + metaHtml + '</dl>' +
            body +
            '<footer class="foot"><span>' + esc(t('report.title')) + ', ' + esc(fileName) + '</span><span>' + esc(InventorySystem.Utils.formatDate(now)) + '</span></footer>' +
            '</main><script>' + script + '<\/script></body></html>';
    }

    /**
     * Abrir el informe en una pestaña nueva
     * @param {string} scope - negative, pallet, all, dashboard o complete
     * @param {Object} [options] - { print: true } abre el cuadro de impresión al cargar
     */
    function open(scope, options) {
        try {
            const rows = InventorySystem.Inventory.getInventoryData();
            if (!rows || rows.length === 0) {
                InventorySystem.Utils.showError(t('report.noData'));
                return false;
            }
            const html = build(scope, options);
            const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
            const tab = window.open(url, '_blank');
            if (!tab) {
                InventorySystem.Utils.showError(t('report.blocked'), t('report.blocked.detail'));
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error al generar el informe:', error);
            InventorySystem.Utils.showError(t('report.error'));
            return false;
        }
    }

    InventorySystem.Report = { open, build };
})(window.InventorySystem || (window.InventorySystem = {}));
