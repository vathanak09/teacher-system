"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  PrintDocumentStyleConfig,
  TableCellCoord,
  TableSectionName,
  TableSelectionController,
  buildActiveSelectionCss,
  buildPrintScopeProps,
  buildTableCellOverridesCss,
} from './printStylePresets';

/**
 * Renders the single modal-level <style> tag for:
 *  1. Persisted per-column, per-row, and per-cell table overrides (Screen + @media print)
 *  2. Active blue selection highlights (@media screen ONLY)
 */
export function PrintTableOverrideStyles({
  scopeId,
  styleConfig,
  tableSelection,
}: {
  scopeId: string;
  styleConfig: PrintDocumentStyleConfig;
  tableSelection?: TableSelectionController;
}) {
  const overridesCss = useMemo(
    () => buildTableCellOverridesCss(scopeId, styleConfig.cellOverrides),
    [scopeId, styleConfig.cellOverrides]
  );

  const selectionCss = useMemo(() => {
    if (!tableSelection || tableSelection.selectedCoords.length === 0) return '';
    return buildActiveSelectionCss(
      scopeId,
      tableSelection.selectionMode,
      tableSelection.selectedCoords,
      tableSelection.applyAllPages
    );
  }, [
    scopeId,
    tableSelection?.selectionMode,
    tableSelection?.selectedCoords,
    tableSelection?.applyAllPages,
  ]);

  if (!overridesCss && !selectionCss) return null;

  return (
    <style
      data-print-table-styles={scopeId}
      dangerouslySetInnerHTML={{
        __html: [overridesCss, selectionCss].filter(Boolean).join('\n'),
      }}
    />
  );
}

function tagTablesInContainer(root: HTMLElement) {
  const tables = root.querySelectorAll('table');
  tables.forEach((tableEl, tableIdx) => {
    const customTk = (tableEl.getAttribute('data-pt-tk') || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const tableKeyAttr = customTk || '';
    tableEl.setAttribute('data-pt-t', String(tableIdx));

    // Tag <col> elements inside <colgroup> so column width overrides resize table-layout: fixed tables
    const colgroups = Array.from(tableEl.children).filter((el) => el.tagName === 'COLGROUP');
    let colGroupCursor = 0;
    colgroups.forEach((cg) => {
      Array.from(cg.children)
        .filter((el) => el.tagName === 'COL')
        .forEach((colEl) => {
          const span = Math.max(1, Number(colEl.getAttribute('span') || 1) || 1);
          colEl.setAttribute('data-pt-col', '1');
          colEl.setAttribute('data-pt-t', String(tableIdx));
          if (tableKeyAttr) colEl.setAttribute('data-pt-tk', tableKeyAttr);
          colEl.setAttribute('data-pt-c', String(colGroupCursor));
          colGroupCursor += span;
        });
    });

    const tagSectionRowElements = (
      rows: Element[],
      secName: TableSectionName,
      rowOffset = 0
    ) => {
      const occupied: boolean[][] = [];
      rows.forEach((trEl, localIdx) => {
        const rowIdx = rowOffset + localIdx;
        trEl.setAttribute('data-pt-row', '1');
        trEl.setAttribute('data-pt-t', String(tableIdx));
        if (tableKeyAttr) trEl.setAttribute('data-pt-tk', tableKeyAttr);
        trEl.setAttribute('data-pt-sec', secName);
        trEl.setAttribute('data-pt-r', String(rowIdx));

        if (!occupied[localIdx]) occupied[localIdx] = [];
        let visualCol = 0;
        const cells = Array.from(trEl.children).filter(
          (el) => el.tagName === 'TD' || el.tagName === 'TH'
        );
        cells.forEach((cellEl) => {
          while (occupied[localIdx][visualCol]) {
            visualCol++;
          }
          const colSpan = Math.max(1, Number(cellEl.getAttribute('colspan') || 1) || 1);
          const rowSpan = Math.max(1, Number(cellEl.getAttribute('rowspan') || 1) || 1);

          for (let r = 0; r < rowSpan; r++) {
            if (!occupied[localIdx + r]) occupied[localIdx + r] = [];
            for (let c = 0; c < colSpan; c++) {
              occupied[localIdx + r][visualCol + c] = true;
            }
          }

          cellEl.setAttribute('data-pt-cell', '1');
          cellEl.setAttribute('data-pt-t', String(tableIdx));
          if (tableKeyAttr) cellEl.setAttribute('data-pt-tk', tableKeyAttr);
          else cellEl.removeAttribute('data-pt-tk');
          cellEl.setAttribute('data-pt-sec', secName);
          cellEl.setAttribute('data-pt-r', String(rowIdx));
          cellEl.setAttribute('data-pt-c', String(visualCol));
          if (colSpan > 1) {
            cellEl.setAttribute('data-pt-cs', String(colSpan));
            cellEl.setAttribute('data-pt-spanned', '1');
          } else {
            cellEl.removeAttribute('data-pt-cs');
            cellEl.removeAttribute('data-pt-spanned');
          }

          visualCol += colSpan;
        });
      });
    };

    const theads = Array.from(tableEl.children).filter((el) => el.tagName === 'THEAD');
    const tbodies = Array.from(tableEl.children).filter((el) => el.tagName === 'TBODY');
    const tfoots = Array.from(tableEl.children).filter((el) => el.tagName === 'TFOOT');

    if (theads.length === 0 && tbodies.length === 0 && tfoots.length === 0) {
      const bareRows = Array.from(tableEl.children).filter((el) => el.tagName === 'TR');
      tagSectionRowElements(bareRows, 'tbody', 0);
    } else {
      let theadOffset = 0;
      theads.forEach((el) => {
        const rows = Array.from(el.children).filter((c) => c.tagName === 'TR');
        tagSectionRowElements(rows, 'thead', theadOffset);
        theadOffset += rows.length;
      });
      let tbodyRowOffset = 0;
      tbodies.forEach((tb) => {
        const rows = Array.from(tb.children).filter((el) => el.tagName === 'TR');
        tagSectionRowElements(rows, 'tbody', tbodyRowOffset);
        tbodyRowOffset += rows.length;
      });
      let tfootOffset = 0;
      tfoots.forEach((el) => {
        const rows = Array.from(el.children).filter((c) => c.tagName === 'TR');
        tagSectionRowElements(rows, 'tfoot', tfootOffset);
        tfootOffset += rows.length;
      });
    }
  });
}

function readCoordFromCell(
  cellEl: HTMLElement,
  pageIdx: number
): TableCellCoord | null {
  const tStr = cellEl.getAttribute('data-pt-t');
  const tkStr = cellEl.getAttribute('data-pt-tk') || undefined;
  const secStr = cellEl.getAttribute('data-pt-sec') as TableSectionName | null;
  const rStr = cellEl.getAttribute('data-pt-r');
  const cStr = cellEl.getAttribute('data-pt-c');
  const csStr = cellEl.getAttribute('data-pt-cs');
  if (tStr === null || !secStr || rStr === null || cStr === null) return null;
  const rawText = (cellEl.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    pageIdx,
    tableIdx: Number(tStr),
    tableKey: tkStr,
    section: secStr,
    rowIdx: Number(rStr),
    colIdx: Number(cStr),
    colSpan: csStr ? Number(csStr) : 1,
    textPreview: rawText.slice(0, 28),
  };
}

function isSameCoord(a: TableCellCoord, b: TableCellCoord): boolean {
  return (
    a.pageIdx === b.pageIdx &&
    a.tableIdx === b.tableIdx &&
    a.section === b.section &&
    a.rowIdx === b.rowIdx &&
    a.colIdx === b.colIdx
  );
}

function buildRangeCoords(
  container: HTMLElement,
  anchor: TableCellCoord,
  target: TableCellCoord,
  mode: 'cell' | 'row' | 'col'
): TableCellCoord[] {
  if (
    anchor.pageIdx !== target.pageIdx ||
    anchor.tableIdx !== target.tableIdx ||
    (mode !== 'col' && anchor.section !== target.section)
  ) {
    return [target];
  }
  const rMin = Math.min(anchor.rowIdx, target.rowIdx);
  const rMax = Math.max(anchor.rowIdx, target.rowIdx);
  const anchorEndCol = anchor.colIdx + Math.max(1, anchor.colSpan || 1) - 1;
  const targetEndCol = target.colIdx + Math.max(1, target.colSpan || 1) - 1;
  const cMin = Math.min(anchor.colIdx, target.colIdx);
  const cMax = Math.max(anchorEndCol, targetEndCol);

  const cells =
    mode === 'col'
      ? container.querySelectorAll(`[data-pt-t="${anchor.tableIdx}"][data-pt-c]`)
      : container.querySelectorAll(
          `[data-pt-t="${anchor.tableIdx}"][data-pt-sec="${anchor.section}"][data-pt-c]`
        );
  const out: TableCellCoord[] = [];
  const seenRow = new Set<number>();
  const seenCol = new Set<number>();

  cells.forEach((el) => {
    const r = Number(el.getAttribute('data-pt-r'));
    const c = Number(el.getAttribute('data-pt-c'));
    const cs = Number(el.getAttribute('data-pt-cs') || 1);
    if (mode === 'cell') {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) {
        const coord = readCoordFromCell(el as HTMLElement, anchor.pageIdx);
        if (coord) out.push(coord);
      }
    } else if (mode === 'row') {
      if (r >= rMin && r <= rMax && !seenRow.has(r)) {
        seenRow.add(r);
        const coord = readCoordFromCell(el as HTMLElement, anchor.pageIdx);
        if (coord) out.push(coord);
      }
    } else if (mode === 'col') {
      if (cs === 1 && c >= cMin && c <= cMax && !seenCol.has(c)) {
        seenCol.add(c);
        const coord = readCoordFromCell(el as HTMLElement, anchor.pageIdx);
        if (coord) out.push(coord);
      }
    }
  });

  return out.length > 0 ? out : [target];
}

export interface PrintInteractiveSheetProps {
  scopeId: string;
  pageIdx: number;
  styleConfig: PrintDocumentStyleConfig;
  tableSelection?: TableSelectionController;
  onCellSelected?: () => void;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'data-print-grid'?: string;
  children: React.ReactNode;
}

/**
 * Wraps any printable sheet so users can directly click/drag/Shift-click/Ctrl-click
 * individual cells, rows, or columns on live tables and customize their typography & styling.
 */
export default function PrintInteractiveSheet({
  scopeId,
  pageIdx,
  styleConfig,
  tableSelection,
  onCellSelected,
  className = '',
  style,
  id,
  'data-print-grid': dataPrintGrid,
  children,
}: PrintInteractiveSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragAnchorRef = useRef<TableCellCoord | null>(null);

  const scopeProps = useMemo(
    () => buildPrintScopeProps(styleConfig),
    [styleConfig]
  );

  // Stamp deterministic data-pt-* coordinates on every table/row/cell synchronously after render
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    tagTablesInContainer(root);
  });

  // End drag cleanly if mouseup occurs anywhere in window
  useEffect(() => {
    const handleWinUp = () => {
      isDraggingRef.current = false;
      dragAnchorRef.current = null;
    };
    window.addEventListener('mouseup', handleWinUp);
    return () => window.removeEventListener('mouseup', handleWinUp);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tableSelection || e.button !== 0) return;
      const targetEl = e.target as HTMLElement | null;
      const cellEl = targetEl?.closest('td, th') as HTMLElement | null;
      const root = containerRef.current;
      if (!cellEl || !root || !root.contains(cellEl)) {
        return;
      }

      // Ensure DOM tags are fresh before reading coordinates
      if (cellEl.getAttribute('data-pt-c') === null) {
        tagTablesInContainer(root);
      }

      const coord = readCoordFromCell(cellEl, pageIdx);
      if (!coord) return;

      e.preventDefault();
      e.stopPropagation();

      const mode = tableSelection.selectionMode;
      const isMulti = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey && tableSelection.anchorCoord;

      if (isShift && tableSelection.anchorCoord) {
        const range = buildRangeCoords(root, tableSelection.anchorCoord, coord, mode);
        tableSelection.setSelection(range, tableSelection.anchorCoord);
      } else if (isMulti) {
        const isSameTable = (c: TableCellCoord) =>
          coord.tableKey && c.tableKey
            ? c.tableKey === coord.tableKey
            : c.tableIdx === coord.tableIdx;
        const exists = tableSelection.selectedCoords.some((c) => {
          if (mode === 'row') {
            return (
              (tableSelection.applyAllPages || c.pageIdx === coord.pageIdx) &&
              isSameTable(c) &&
              c.section === coord.section &&
              c.rowIdx === coord.rowIdx
            );
          }
          if (mode === 'col') {
            return (
              (tableSelection.applyAllPages || c.pageIdx === coord.pageIdx) &&
              isSameTable(c) &&
              c.colIdx === coord.colIdx
            );
          }
          return isSameCoord(c, coord);
        });
        const nextList = exists
          ? tableSelection.selectedCoords.filter((c) => {
              if (mode === 'row') {
                return !(
                  (tableSelection.applyAllPages || c.pageIdx === coord.pageIdx) &&
                  isSameTable(c) &&
                  c.section === coord.section &&
                  c.rowIdx === coord.rowIdx
                );
              }
              if (mode === 'col') {
                return !(
                  (tableSelection.applyAllPages || c.pageIdx === coord.pageIdx) &&
                  isSameTable(c) &&
                  c.colIdx === coord.colIdx
                );
              }
              return !isSameCoord(c, coord);
            })
          : [...tableSelection.selectedCoords, coord];
        tableSelection.setSelection(nextList, coord);
      } else {
        tableSelection.setSelection([coord], coord);
        isDraggingRef.current = true;
        dragAnchorRef.current = coord;
      }

      if (onCellSelected) onCellSelected();
    },
    [tableSelection, pageIdx, onCellSelected]
  );

  const handleMouseOver = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !dragAnchorRef.current || !tableSelection) return;
      const targetEl = e.target as HTMLElement | null;
      const cellEl = targetEl?.closest('td, th') as HTMLElement | null;
      const root = containerRef.current;
      if (!cellEl || !root || !root.contains(cellEl)) return;

      const coord = readCoordFromCell(cellEl, pageIdx);
      if (!coord) return;

      const range = buildRangeCoords(
        root,
        dragAnchorRef.current,
        coord,
        tableSelection.selectionMode
      );
      tableSelection.setSelection(range, dragAnchorRef.current);
    },
    [tableSelection, pageIdx]
  );

  const mergedClassName = [
    scopeProps.className,
    tableSelection ? 'print-table-selectable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      id={id}
      data-print-scope={scopeId}
      data-pt-p={pageIdx}
      data-print-grid={dataPrintGrid}
      className={mergedClassName}
      style={{ ...scopeProps.style, ...style }}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
    >
      {children}
    </div>
  );
}
