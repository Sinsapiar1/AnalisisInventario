/**
 * Resumen del dashboard.
 *
 * Se dibuja con HTML (sin Chart.js) encima de los gráficos: qué revisar,
 * cifras clave y cuatro clasificaciones. Cada elemento lleva a la tabla
 * correspondiente ya filtrada.
 *
 * No modifica los gráficos existentes ni lo que se exporta a PDF.
 */
(function(InventorySystem) {
    'use strict';

    const TOP = 8;

    const t = (key, vars) => InventorySystem.I18n.t(key, vars);
    const tn = (key, count, vars) => InventorySystem.I18n.tn(key, count, vars);
    const fmt = n => InventorySystem.Utils.formatNumber(n);

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    /**
     * Calcular todas las cifras del resumen a partir de las filas del inventario
     */
    function compute(rows) {
        const pairs = new Map(); // código + almacén
        const warehouses = new Map();
        const stockByCode = new Map();
        const codes = new Set();

        let negativeRows = 0;
        let zeroRows = 0;
        let noPalletRows = 0;
        let noPalletUnits = 0;
        let reserved = 0;
        let onOrder = 0;

        rows.forEach(row => {
            const units = Number(row.physicalInventory) || 0;
            const warehouse = row.warehouse || '';
            const key = row.code + '\u0000' + warehouse;
            codes.add(row.code);

            let pair = pairs.get(key);
            if (!pair) {
                pair = { code: row.code, name: row.name || '', total: 0, negativeRows: 0, negativeUnits: 0 };
                pairs.set(key, pair);
            }
            pair.total += units;

            let wh = warehouses.get(warehouse);
            if (!wh) {
                wh = { name: warehouse, units: 0, rows: 0, negativeRows: 0 };
                warehouses.set(warehouse, wh);
            }
            wh.units += units;
            wh.rows++;

            let stock = stockByCode.get(row.code);
            if (!stock) {
                stock = { code: row.code, name: row.name || '', units: 0 };
                stockByCode.set(row.code, stock);
            }
            stock.units += units;

            if (units < 0) {
                negativeRows++;
                pair.negativeRows++;
                pair.negativeUnits += -units;
                wh.negativeRows++;
            } else if (units === 0) {
                zeroRows++;
            }
            if (!row.palletId) {
                noPalletRows++;
                noPalletUnits += units;
            }
            reserved += Math.abs(Number(row.reserved) || 0);
            onOrder += Number(row.inOrder) || 0;
        });

        // Faltantes: balance negativo por código + almacén, agrupado por código (igual que la tabla)
        const shortages = new Map();
        // Compensados: el balance cierra en positivo pero hay pallets en negativo
        const offsets = new Map();

        pairs.forEach(pair => {
            if (pair.total < 0) {
                const item = shortages.get(pair.code) || { code: pair.code, name: pair.name, units: 0 };
                item.units += -pair.total;
                shortages.set(pair.code, item);
            } else if (pair.negativeRows > 0) {
                const item = offsets.get(pair.code) || { code: pair.code, name: pair.name, units: 0, rows: 0 };
                item.units += pair.negativeUnits;
                item.rows += pair.negativeRows;
                offsets.set(pair.code, item);
            }
        });

        const byUnits = (a, b) => b.units - a.units;
        const shortageList = Array.from(shortages.values()).sort(byUnits);
        const offsetList = Array.from(offsets.values()).sort(byUnits);

        return {
            distinctProducts: codes.size,
            warehouseCount: Array.from(warehouses.keys()).filter(name => name !== '').length,
            negativeRows,
            zeroRows,
            noPalletRows,
            noPalletUnits,
            reserved,
            onOrder,
            shortUnits: shortageList.reduce((sum, item) => sum + item.units, 0),
            shortages: shortageList,
            offsets: offsetList,
            offsetRows: offsetList.reduce((sum, item) => sum + item.rows, 0),
            warehouses: Array.from(warehouses.values()).sort(byUnits),
            topStock: Array.from(stockByCode.values()).filter(item => item.units > 0).sort(byUnits)
        };
    }

    /* ---------- Piezas del resumen ---------- */

    function findings(data) {
        const list = el('ul', 'dash-findings');
        const add = (tone, text, action) => {
            const item = el('li', 'dash-finding dash-finding-' + tone);
            item.appendChild(el('span', 'dash-finding-text', text));
            if (action) {
                const button = el('button', 'btn btn-quiet', t('dash.view'));
                button.type = 'button';
                button.setAttribute('aria-label', t('dash.view') + ': ' + text);
                button.addEventListener('click', action);
                item.appendChild(button);
            }
            list.appendChild(item);
        };

        const ui = InventorySystem.UI;

        if (data.shortages.length === 0) {
            add('ok', t('dash.find.short_none'));
        } else {
            add('bad',
                tn('dash.find.short', data.shortages.length, { n: fmt(data.shortages.length), units: fmt(data.shortUnits) }),
                () => ui.showNegativeInventory(''));
        }
        if (data.offsetRows > 0) {
            add('warn',
                tn('dash.find.offset', data.offsets.length, { n: fmt(data.offsets.length), rows: fmt(data.offsetRows) }),
                () => ui.showAllInventory({ status: 'negative' }));
        }
        if (data.noPalletRows > 0) {
            add('note', t('dash.find.noPallet', { rows: fmt(data.noPalletRows), units: fmt(data.noPalletUnits) }),
                () => ui.showAllInventory({ pallet: 'without' }));
        }
        if (data.zeroRows > 0) {
            add('note', t('dash.find.zero', { rows: fmt(data.zeroRows) }),
                () => ui.showAllInventory({ status: 'zero' }));
        }
        return list;
    }

    function kpis(data) {
        const band = el('dl', 'dash-kpis');
        const add = (label, value, tone) => {
            const item = el('div', 'dash-kpi' + (tone ? ' dash-kpi-' + tone : ''));
            item.appendChild(el('dt', null, label));
            item.appendChild(el('dd', null, fmt(value)));
            band.appendChild(item);
        };
        add(t('dash.kpi.products'), data.distinctProducts);
        add(t('dash.kpi.warehouses'), data.warehouseCount);
        add(t('dash.kpi.negativeUnits'), data.shortUnits, data.shortUnits > 0 ? 'bad' : null);
        add(t('dash.kpi.negativeRows'), data.negativeRows, data.negativeRows > 0 ? 'warn' : null);
        add(t('dash.kpi.reserved'), data.reserved);
        add(t('dash.kpi.onOrder'), data.onOrder);
        return band;
    }

    /**
     * Clasificación con barras
     * @param {Object} config - { title, help, tone, items: [{ label, sub, note, value, open }], onMore }
     */
    function ranking(config) {
        const panel = el('section', 'dash-rank dash-rank-' + config.tone);
        panel.appendChild(el('h4', null, config.title));
        panel.appendChild(el('p', 'dash-rank-help', config.help));

        if (config.items.length === 0) {
            panel.appendChild(el('p', 'dash-rank-empty', t('dash.rank.empty')));
            return panel;
        }

        const visible = config.items.slice(0, TOP);
        const max = Math.max.apply(null, visible.map(item => Math.abs(item.value))) || 1;
        const list = el('ol', 'dash-rank-list');

        visible.forEach(item => {
            const li = el('li');
            const row = el(item.open ? 'button' : 'div', 'dash-rank-row');
            if (item.open) {
                row.type = 'button';
                row.setAttribute('aria-label',
                    t('dash.open', { name: item.label + (item.sub ? ' ' + item.sub : '') }) + ' (' + fmt(item.value) + ')');
                row.addEventListener('click', item.open);
            }

            const head = el('span', 'dash-rank-head');
            const name = el('span', 'dash-rank-name');
            name.appendChild(el('strong', null, item.label));
            if (item.sub) name.appendChild(el('span', null, ' ' + item.sub));
            head.appendChild(name);
            head.appendChild(el('span', 'dash-rank-value', fmt(item.value)));
            row.appendChild(head);

            const track = el('span', 'dash-rank-track');
            const fill = el('span', 'dash-rank-fill');
            // Un mínimo visible para que los valores pequeños no desaparezcan
            fill.style.width = Math.max(1.5, Math.abs(item.value) / max * 100) + '%';
            track.appendChild(fill);
            row.appendChild(track);

            if (item.note) row.appendChild(el('span', 'dash-rank-note', item.note));

            li.appendChild(row);
            list.appendChild(li);
        });
        panel.appendChild(list);

        const rest = config.items.length - visible.length;
        if (rest > 0) {
            if (config.onMore) {
                const more = el('button', 'dash-rank-more', t('dash.rank.more', { n: fmt(rest) }));
                more.type = 'button';
                more.addEventListener('click', config.onMore);
                panel.appendChild(more);
            } else {
                panel.appendChild(el('p', 'dash-rank-more', t('dash.rank.more', { n: fmt(rest) })));
            }
        }
        return panel;
    }

    function rankings(data) {
        const ui = InventorySystem.UI;
        const grid = el('div', 'dash-rank-grid');

        grid.appendChild(ranking({
            tone: 'bad',
            title: t('dash.rank.short'),
            help: t('dash.rank.short.help'),
            items: data.shortages.map(item => ({
                label: String(item.code),
                sub: item.name,
                value: -item.units,
                open: () => ui.showNegativeInventory(item.code)
            })),
            onMore: () => ui.showNegativeInventory('')
        }));

        grid.appendChild(ranking({
            tone: 'warn',
            title: t('dash.rank.offset'),
            help: t('dash.rank.offset.help'),
            items: data.offsets.map(item => ({
                label: String(item.code),
                sub: item.name,
                value: -item.units,
                note: tn('dash.rank.pallets', item.rows, { n: fmt(item.rows) }),
                open: () => ui.showAllInventory({ search: item.code, status: 'negative' })
            })),
            onMore: () => ui.showAllInventory({ status: 'negative' })
        }));

        grid.appendChild(ranking({
            tone: 'stock',
            title: t('dash.rank.warehouse'),
            help: t('dash.rank.warehouse.help'),
            items: data.warehouses.map(item => ({
                label: item.name || t('value.noWarehouse'),
                value: item.units,
                note: item.negativeRows > 0
                    ? t('dash.rank.rowsNeg', { n: fmt(item.rows), neg: fmt(item.negativeRows) })
                    : t('dash.rank.rows', { n: fmt(item.rows) }),
                open: item.name ? () => ui.showAllInventory({ warehouses: [item.name] }) : null
            }))
        }));

        grid.appendChild(ranking({
            tone: 'stock',
            title: t('dash.rank.top'),
            help: t('dash.rank.top.help'),
            items: data.topStock.map(item => ({
                label: String(item.code),
                sub: item.name,
                value: item.units,
                open: () => ui.showAllInventory({ search: item.code })
            }))
        }));

        return grid;
    }

    /**
     * Dibujar (o volver a dibujar) el resumen al principio del dashboard
     */
    function render() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        container.querySelectorAll('.dash-summary, .dash-charts-title').forEach(node => node.remove());

        const rows = InventorySystem.Inventory.getInventoryData();
        if (!rows || rows.length === 0) return;

        const data = compute(rows);

        const summary = el('section', 'dash-summary');
        summary.setAttribute('aria-label', t('dash.summary'));
        summary.appendChild(el('h3', 'dash-title', t('dash.findings')));
        summary.appendChild(findings(data));
        summary.appendChild(kpis(data));
        summary.appendChild(rankings(data));

        const chartsTitle = el('h3', 'dash-title dash-charts-title', t('dash.charts'));

        // Debajo de los botones de exportación, encima de los gráficos
        const exportButtons = container.querySelector(':scope > .export-buttons');
        const anchor = exportButtons ? exportButtons.nextSibling : container.firstChild;
        container.insertBefore(summary, anchor);
        container.insertBefore(chartsTitle, summary.nextSibling);
    }

    /**
     * Enganchar el resumen al render del dashboard sin tocar el módulo de gráficos
     */
    function install() {
        const charts = InventorySystem.Charts;
        if (!charts || charts.__summaryInstalled) return;
        const originalRender = charts.renderDashboard;

        charts.renderDashboard = function() {
            try {
                render();
            } catch (error) {
                // El resumen nunca debe impedir que se vean los gráficos
                console.error('No se pudo dibujar el resumen del dashboard:', error);
            }
            return typeof originalRender === 'function' ? originalRender.apply(this, arguments) : undefined;
        };
        charts.__summaryInstalled = true;
    }

    InventorySystem.DashboardSummary = { install, render, compute };
})(window.InventorySystem || (window.InventorySystem = {}));
