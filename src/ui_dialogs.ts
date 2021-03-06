/**
 * a set of simple dialogs for LineUp
 *
 * Created by Samuel Gratzl on 24.08.2015.
 */

import Column from './model/Column';
import StringColumn from './model/StringColumn';
import CategoricalColumn from './model/CategoricalColumn';
import LinkColumn from './model/LinkColumn';
import StackColumn from './model/StackColumn';
import ScriptColumn from './model/ScriptColumn';
import BooleanColumn from './model/BooleanColumn';
import NumberColumn, {IMappingFunction} from './model/NumberColumn';
import CategoricalNumberColumn from './model/CategoricalNumberColumn';
import MultiValueColumn from './model/MultiValueColumn';
import {offset} from './utils';
import MappingEditor from './mappingeditor';
import {Selection, select, event as d3event, scale as d3scale, behavior} from 'd3';
import * as d3 from 'd3';
import DataProvider from './provider/ADataProvider';
import {Sort} from './model/BoxPlotColumn';


export function dialogForm(title: string, body: string) {
  return '<span style="font-weight: bold" class="lu-popup-title">' + title + '</span>' +
    '<form onsubmit="return false">' +
    body + '<button type = "submit" class="ok fa fa-check" title="ok"></button>' +
    '<button type = "reset" class="cancel fa fa-times" title="cancel"></button>' +
    '<button type = "button" class="reset fa fa-undo" title="reset"></button></form>';
}

export function sortDialogForm(title:string, body:string) {
  return '<span style="font-weight: bold" class="lu-popup-title">' + title + '</span>' +
    '<form onsubmit="return false">' + body;
}


/**
 * creates a simple popup dialog under the given attachment
 * @param attachement
 * @param title
 * @param body
 * @returns {Selection<any>}
 */
export function makePopup(attachement: Selection<any>, title: string, body: string) {
  const pos = offset(<Element>attachement.node());
  const $popup = select('body').append('div')
    .attr({
      'class': 'lu-popup2'
    }).style({
      left: pos.left + 'px',
      top: pos.top + 'px'
    }).html(dialogForm(title, body));

  function movePopup() {
    //.style("left", (this.parentElement.offsetLeft + (<any>event).dx) + 'px')
    //.style("top", (this.parentElement.offsetTop + event.dy) + 'px');
    //const mouse = d3.mouse(this.parentElement);
    $popup.style({
      left: (this.parentElement.offsetLeft + (<any>d3event).dx) + 'px',
      top: (this.parentElement.offsetTop + (<any>d3event).dy) + 'px'
    });
  }

  $popup.select('span.lu-popup-title').call(behavior.drag().on('drag', movePopup));
  $popup.on('keydown', () => {
    if ((<KeyboardEvent>d3event).which === 27) {
      $popup.remove();
    }
  });
  const auto = <HTMLInputElement>$popup.select('input[autofocus]').node();
  if (auto) {
    auto.focus();
  }
  return $popup;

}

export function makeSortPopup(attachement: Selection<any>, title: string, body: string) {
  const pos = offset(<Element>attachement.node());
  const $popup = select('body').append('div')
    .attr({
      'class': 'lu-popup2'
    }).style({
      left: pos.left + 'px',
      top: pos.top + 'px'
    }).html(sortDialogForm(title, body));

  return $popup;

}

/**
 * opens a rename dialog for the given column
 * @param column the column to rename
 * @param $header the visual header element of this column
 */
export function openRenameDialog(column: Column, $header: d3.Selection<Column>) {
  const popup = makePopup($header, 'Rename Column', `

    <input type="text" size="15" value="${column.label}" required="required" autofocus="autofocus"><br>
    <input type="color" size="15" value="${column.color}" required="required"><br>
    <textarea rows="5">${column.description}</textarea><br>`);

  popup.select('.ok').on('click', function () {

    const newValue = popup.select('input[type="text"]').property('value');
    const newColor = popup.select('input[type="color"]').property('value');
    const newDescription = popup.select('textarea').property('value');
    column.setMetaData({label: newValue, color: newColor, description: newDescription});
    popup.remove();
  });

  popup.select('.cancel').on('click', function () {
    popup.remove();
  });
}


/**
 * opens a dialog for editing the link of a column
 * @param column the column to rename
 * @param $header the visual header element of this column
 * @param templates list of possible link templates
 * @param idPrefix dom id prefix
 */
export function openEditLinkDialog(column: LinkColumn, $header: d3.Selection<Column>, templates: string[] = [], idPrefix: string) {
  let t = `<input type="text" size="15" value="${column.getLink()}" required="required" autofocus="autofocus" ${templates.length > 0 ? 'list="ui' + idPrefix + 'lineupPatternList"' : ''}><br>`;
  if (templates.length > 0) {
    t += '<datalist id="ui${idPrefix}lineupPatternList">' + templates.map((t) => `<option value="${t}">`) + '</datalist>';
  }

  const popup = makePopup($header, 'Edit Link ($ as Placeholder)', t);

  popup.select('.ok').on('click', function () {
    const newValue = popup.select('input[type="text"]').property('value');
    column.setLink(newValue);

    popup.remove();
  });

  popup.select('.cancel').on('click', function () {
    popup.remove();
  });
}


function hidePopClickedOutsideMe(popup, rendererContent, currentElement) {

  d3.select('body').on('click', function () {
    const outside = rendererContent.filter(currentElement).empty();
    if (outside) {
      popup.remove();
      d3.select(this).on('click', null);
    }
  });
}

// Renderer type change
export function rendererTypeDialog(column: Column, $header: d3.Selection<Column>) {
  let rendererType = column.getRendererType();
  const rendererTypeList = column.getRendererList();

  const popup = makeSortPopup($header, 'Change Visualization </br>', rendererTypeList.map(function (d, i) {
    return `<input type="radio" name="renderertype" value=${d.type}  ${(rendererType === d.type) ? 'checked' : ''}> ${d.label}<br>`;

  }).join('\n'));


  function thiselement() {
    return this === (<any>d3.event).target;

  }

  const rendererContent = d3.selectAll('input[name="renderertype"]');
  rendererContent.on('change', function () {
    const selectedRenderer = this;
    rendererType = selectedRenderer.value;
    column.setRendererType(selectedRenderer.value);

  });

//  To detect if the mouse click event is triggered outside the sort dialog
  hidePopClickedOutsideMe(popup, rendererContent, thiselement);

}

// Sort  Dialog.
export function sortDialog(column: MultiValueColumn, $header: d3.Selection<MultiValueColumn>) {

  let rank = column.getSortMethod();
  const valueString: any = [Sort[Sort.min], Sort[Sort.max], Sort[Sort.median], Sort[Sort.q1], Sort[Sort.q3]];
  const sortLabel: any = ['Min', 'Max', 'Median', 'Q1', 'Q3'];

  const popup = makeSortPopup($header, 'Sort By <br>', valueString.map(function (d, i) {
    return `<input type="radio" name="multivaluesort" value=${d}  ${(rank === d) ? 'checked' : ''} > ${sortLabel[i]} <br>`;

  }).join('\n'));

  function thiselement() {
    return this === (<any>d3.event).target;
  }

  // To detect if the mouse click event is triggered outside the sort dialog
  const sortContent = d3.selectAll('input[name=multivaluesort]');
  sortContent.on('change', function () {
    const selectedSortMethod = this;
    rank = selectedSortMethod.value;
    column.setSortMethod(rank);

  });

  // To detect if the mouse click event is triggered outside the sort dialog
  hidePopClickedOutsideMe(popup, sortContent, thiselement);

}


/**
 * opens a search dialog for the given column
 * @param column the column to rename
 * @param $header the visual header element of this column
 * @param provider the data provider for the actual search
 */
export function openSearchDialog(column: Column, $header: d3.Selection<Column>, provider: DataProvider) {
  const popup = makePopup($header, 'Search', '<input type="text" size="15" value="" required="required" autofocus="autofocus"><br><label><input type="checkbox">RegExp</label><br>');

  popup.select('input[type="text"]').on('input', function () {
    let search: any = (<HTMLInputElement>this).value;
    if (search.length >= 3) {
      const isRegex = popup.select('input[type="checkbox"]').property('checked');
      if (isRegex) {
        search = new RegExp(search);
      }
      provider.searchAndJump(search, column);
    }
  });

  function updateImpl() {
    let search = popup.select('input[type="text"]').property('value');
    const isRegex = popup.select('input[type="text"]').property('checked');
    if (search.length > 0) {
      if (isRegex) {
        search = new RegExp(search);
      }
      provider.searchAndJump(search, column);
    }
    popup.remove();
  }

  popup.select('input[type="checkbox"]').on('change', updateImpl);
  popup.select('.ok').on('click', updateImpl);

  popup.select('.cancel').on('click', function () {
    popup.remove();
  });
}

/**
 * opens a dialog for editing the weights of a stack column
 * @param column the column to filter
 * @param $header the visual header element of this column
 */
export function openEditWeightsDialog(column: StackColumn, $header: d3.Selection<Column>) {
  const weights = column.getWeights(),
    children = column.children.map((d, i) => ({col: d, weight: weights[i] * 100} ));

  //map weights to pixels
  const scale = d3scale.linear().domain([0, 100]).range([0, 120]);

  const $popup = makePopup($header, 'Edit Weights', '<table></table>');

  //show as a table with inputs and bars
  const $rows = $popup.select('table').selectAll('tr').data(children);
  const $rowsEnter = $rows.enter().append('tr');
  $rowsEnter.append('td')
    .append('input').attr({
    type: 'number',
    value: (d) => d.weight,
    min: 0,
    max: 100,
    size: 5
  }).on('input', function (d) {
    d.weight = +this.value;
    redraw();
  });

  $rowsEnter.append('td').append('div')
    .attr('class', (d) => 'bar ' + d.col.cssClass)
    .style('background-color', (d) => d.col.color);

  $rowsEnter.append('td').text((d) => d.col.label);

  function redraw() {
    $rows.select('.bar').transition().style('width', (d) => scale(d.weight) + 'px');
  }

  redraw();

  $popup.select('.cancel').on('click', function () {
    column.setWeights(weights);
    $popup.remove();
  });
  $popup.select('.reset').on('click', function () {
    children.forEach((d, i) => d.weight = weights[i] * 100);
    $rows.select('input').property('value', (d) => d.weight);
    redraw();
  });
  $popup.select('.ok').on('click', function () {
    column.setWeights(children.map((d) => d.weight));
    $popup.remove();
  });
}

/**
 * flags the header to be filtered
 * @param $header
 * @param filtered
 */
function markFiltered($header: d3.Selection<Column>, filtered = false) {
  $header.classed('filtered', filtered);
}

function sortbyName(prop: string) {
  return function (a, b) {
    const av = a[prop],
      bv = b[prop];
    if (av.toLowerCase() < bv.toLowerCase()) {
      return -1;
    }
    if (av.toLowerCase() > bv.toLowerCase()) {
      return 1;
    }
    return 0;
  };
}

/**
 * opens a dialog for filtering a categorical column
 * @param column the column to rename
 * @param $header the visual header element of this column
 */
function openCategoricalFilter(column: CategoricalColumn, $header: d3.Selection<Column>) {
  const bak = column.getFilter() || [];
  const popup = makePopup($header, 'Edit Filter', '<div class="selectionTable"><table><thead><th class="selectAll"></th><th>Category</th></thead><tbody></tbody></table></div>');

  // list all data rows !
  const colors = column.categoryColors,
    labels = column.categoryLabels;
  const trData = column.categories.map(function (d, i) {
    return {cat: d, label: labels[i], isChecked: bak.length === 0 || bak.indexOf(d) >= 0, color: colors[i]};
  }).sort(sortbyName('label'));

  const $rows = popup.select('tbody').selectAll('tr').data(trData);
  const $rowsEnter = $rows.enter().append('tr');
  $rowsEnter.append('td').attr('class', 'checkmark');
  $rowsEnter.append('td').attr('class', 'datalabel').text((d) => d.label);
  $rowsEnter.on('click', (d) => {
    d.isChecked = !d.isChecked;
    redraw();
  });

  function redraw() {
    $rows.select('.checkmark').html((d) => '<i class="fa fa-' + ((d.isChecked) ? 'check-' : '') + 'square-o"></i>');
    $rows.select('.datalabel').style('opacity', (d) => d.isChecked ? '1.0' : '.8');
  }

  redraw();

  let isCheckedAll = true;

  function redrawSelectAll() {
    popup.select('.selectAll').html((d) => '<i class="fa fa-' + ((isCheckedAll) ? 'check-' : '') + 'square-o"></i>');
    popup.select('thead').on('click', () => {
      isCheckedAll = !isCheckedAll;
      trData.forEach((row) => row.isChecked = isCheckedAll);
      redraw();
      redrawSelectAll();
    });
  }

  redrawSelectAll();

  function updateData(filter) {
    markFiltered($header, filter && filter.length > 0 && filter.length < trData.length);
    column.setFilter(filter);
  }

  popup.select('.cancel').on('click', function () {
    updateData(bak);
    popup.remove();
  });
  popup.select('.reset').on('click', function () {
    trData.forEach((d) => d.isChecked = true);
    redraw();
    updateData(null);
  });
  popup.select('.ok').on('click', function () {
    let f = trData.filter((d) => d.isChecked).map((d) => d.cat);
    if (f.length === trData.length) {
      f = [];
    }
    updateData(f);
    popup.remove();
  });
}

/**
 * opens a dialog for filtering a string column
 * @param column the column to filter
 * @param $header the visual header element of this column
 */
function openStringFilter(column: StringColumn, $header: d3.Selection<Column>) {
  let bak = column.getFilter() || '';
  const bakMissing = bak === StringColumn.FILTER_MISSING;
  if (bakMissing) {
    bak = '';
  }

  const $popup = makePopup($header, 'Filter',
    `<input type="text" placeholder="containing..." autofocus="true" size="15" value="${(bak instanceof RegExp) ? bak.source : bak}" autofocus="autofocus">
    <br><label><input type="checkbox" ${(bak instanceof RegExp) ? 'checked="checked"' : ''}>RegExp</label><br><label><input class="lu_filter_missing" type="checkbox" ${bakMissing ? 'checked="checked"' : ''}>Filter Missing</label>
    <br>`);

  function updateData(filter) {
    markFiltered($header, (filter && filter !== ''));
    column.setFilter(filter);
  }

  function updateImpl(force) {
    //get value
    let search: any = $popup.select('input[type="text"]').property('value');
    const filterMissing = $popup.select('input[type="checkbox"].lu_filter_missing').property('checked');

    if (filterMissing && search === '') {
      search = StringColumn.FILTER_MISSING;
    }
    if (search === '') { //reset
      updateData(search);
      return;
    }
    if (search.length >= 3 || force) {
      const isRegex = $popup.select('input[type="checkbox"]:first-of-type').property('checked');
      if (isRegex && search !== StringColumn.FILTER_MISSING) {
        search = new RegExp(search);
      }
      updateData(search);
    }

  }

  $popup.selectAll('input[type="checkbox"]').on('change', updateImpl);
  $popup.select('input[type="text"]').on('input', updateImpl);

  $popup.select('.cancel').on('click', function () {
    $popup.select('input[type="text"]').property('value', bak || '');
    $popup.select('input[type="checkbox"]:first-of-type').property('checked', bak instanceof RegExp ? 'checked' : null);
    $popup.select('input[type="checkbox"].lu_filter_missing').property('checked', bakMissing ? 'checked' : null);
    updateData(bak);
    $popup.remove();
  });
  $popup.select('.reset').on('click', function () {
    $popup.select('input[type="text"]').property('value', '');
    $popup.selectAll('input[type="checkbox"]').property('checked', null);
    updateData(null);
  });
  $popup.select('.ok').on('click', function () {
    updateImpl(true);
    $popup.remove();
  });
}


/**
 * opens a dialog for filtering a boolean column
 * @param column the column to filter
 * @param $header the visual header element of this column
 */
function openBooleanFilter(column: BooleanColumn, $header: d3.Selection<Column>) {
  const bak = column.getFilter();

  const $popup = makePopup($header, 'Filter',
    `<label><input type="radio" name="boolean_check" value="null" ${bak === null ? 'checked="checked"' : ''}>No Filter</label><br>
     <label><input type="radio" name="boolean_check" value="true" ${bak === true ? 'checked="checked"' : ''}>True</label><br>
     <label><input type="radio" name="boolean_check" value="false" ${bak === false ? 'checked="checked"' : ''}>False</label>
    <br>`);

  function updateData(filter) {
    markFiltered($header, (filter !== null));
    column.setFilter(filter);
  }

  function updateImpl() {
    //get value
    const isTrue = $popup.select('input[type="radio"][value="true"]').property('checked');
    const isFalse = $popup.select('input[type="radio"][value="false"]').property('checked');
    updateData(isTrue ? true : (isFalse ? false : null));
  }

  $popup.selectAll('input[type="radio"]').on('change', updateImpl);

  $popup.select('.cancel').on('click', function () {
    updateData(bak);
    $popup.remove();
  });
  $popup.select('.reset').on('click', function () {
    const v = bak === null ? 'null' : String(bak);
    $popup.selectAll('input[type="radio"]').property('checked', function () {
      return this.value === v;
    });
    updateData(null);
  });
  $popup.select('.ok').on('click', function () {
    updateImpl();
    $popup.remove();
  });
}


/**
 * opens a dialog for editing the script code
 * @param column the column to edit
 * @param $header the visual header element of this column
 */
export function openEditScriptDialog(column: ScriptColumn, $header: d3.Selection<Column>) {
  const bak = column.getScript();
  const $popup = makePopup($header, 'Edit Script',
    `Parameters: <code>values: number[], children: Column[]</code><br>
      <textarea autofocus="true" rows="5" autofocus="autofocus" style="width: 95%;">${column.getScript()}</textarea><br>`);

  function updateData(script) {
    column.setScript(script);
  }

  function updateImpl() {
    //get value
    const script = $popup.select('textarea').property('value');
    updateData(script);
  }

  $popup.select('.cancel').on('click', function () {
    $popup.select('textarea').property('value', bak);
    updateData(bak);
    $popup.remove();
  });
  $popup.select('.reset').on('click', function () {
    $popup.select('textarea').property('value', ScriptColumn.DEFAULT_SCRIPT);
    updateData(ScriptColumn.DEFAULT_SCRIPT);
  });
  $popup.select('.ok').on('click', function () {
    updateImpl();
    $popup.remove();
  });
}

/**
 * opens the mapping editor for a given NumberColumn
 * @param column the column to rename
 * @param $header the visual header element of this column
 * @param data the data provider for illustrating the mapping by example
 * @param idPrefix dom id prefix
 */
function openMappingEditor(column: NumberColumn, $header: d3.Selection<any>, data: DataProvider, idPrefix: string) {
  const pos = offset($header.node()),
    original = column.getOriginalMapping();
  let bakfilter = column.getFilter(),
    bak = column.getMapping(),
    act: IMappingFunction = bak.clone(),
    actfilter = bakfilter;

  const popup = select('body').append('div')
    .attr({
      'class': 'lu-popup'
    }).style({
      left: pos.left + 'px',
      top: pos.top + 'px'
    })
    .html(dialogForm('Change Mapping', '<div class="mappingArea"></div>'));

  function applyMapping(newscale: IMappingFunction, filter: {min: number, max: number, filterMissing: boolean}) {
    act = newscale;
    actfilter = filter;
    markFiltered($header, !newscale.eq(original) || (bakfilter.min !== filter.min || bakfilter.max !== filter.min || bakfilter.filterMissing !== filter.filterMissing));

    column.setMapping(newscale);
    column.setFilter(filter);
  }

  const editorOptions = {
    idPrefix,
    callback: applyMapping,
    triggerCallback: 'dragend'
  };
  const dataSample = data.mappingSample(column);
  let editor = new MappingEditor(<HTMLElement>popup.select('.mappingArea').node(), act, original, actfilter, dataSample, editorOptions);


  popup.select('.ok').on('click', function () {
    applyMapping(editor.scale, editor.filter);
    popup.remove();
  });
  popup.select('.cancel').on('click', function () {
    column.setMapping(bak);
    markFiltered($header, !bak.eq(original));
    popup.remove();
  });
  popup.select('.reset').on('click', function () {
    bak = original;
    act = bak.clone();
    bakfilter = NumberColumn.noFilter();
    actfilter = bakfilter;
    applyMapping(act, actfilter);
    popup.selectAll('.mappingArea *').remove();
    editor = new MappingEditor(<HTMLElement>popup.select('.mappingArea').node(), act, original, actfilter, dataSample, editorOptions);
  });
}


/**
 * opens the mapping editor for a given CategoricalNumberColumn, i.e. to map categories to numbers
 * @param column the column to rename
 * @param $header the visual header element of this column
 */
function openCategoricalMappingEditor(column: CategoricalNumberColumn, $header: d3.Selection<any>) {
  const bak = column.getFilter() || [];


  const scale = d3scale.linear().domain([0, 100]).range([0, 120]);

  const $popup = makePopup($header, 'Edit Categorical Mapping', '<div class="selectionTable"><table><thead><th class="selectAll"></th><th colspan="2">Scale</th><th>Category</th></thead><tbody></tbody></table></div>');

  const range = column.getScale().range,
    colors = column.categoryColors,
    labels = column.categoryLabels;

  const trData = column.categories.map((d, i) => {
    return {
      cat: d,
      label: labels[i],
      isChecked: bak.length === 0 || bak.indexOf(d) >= 0,
      range: range[i] * 100,
      color: colors[i]
    };
  }).sort(sortbyName('label'));

  const $rows = $popup.select('tbody').selectAll('tr').data(trData);
  const $rowsEnter = $rows.enter().append('tr');
  $rowsEnter.append('td').attr('class', 'checkmark').on('click', (d) => {
    d.isChecked = !d.isChecked;
    redraw();
  });
  $rowsEnter.append('td')
    .append('input').attr({
    type: 'number',
    value: (d) => d.range,
    min: 0,
    max: 100,
    size: 5
  }).on('input', function (d) {
    d.range = +this.value;
    redraw();
  });
  $rowsEnter.append('td').append('div').attr('class', 'bar').style('background-color', (d) => d.color);
  $rowsEnter.append('td').attr('class', 'datalabel').text((d) => d.label);

  function redraw() {
    $rows.select('.checkmark').html((d) => '<i class="fa fa-' + ((d.isChecked) ? 'check-' : '') + 'square-o"></i>');
    $rows.select('.bar').transition().style('width', (d) => scale(d.range) + 'px');
    $rows.select('.datalabel').style('opacity', (d) => d.isChecked ? '1.0' : '.8');
  }

  redraw();

  let isCheckedAll = true;

  function redrawSelectAll() {
    $popup.select('.selectAll').html((d) => '<i class="fa fa-' + ((isCheckedAll) ? 'check-' : '') + 'square-o"></i>');
    $popup.select('thead').on('click', () => {
      isCheckedAll = !isCheckedAll;
      trData.forEach((row) => row.isChecked = isCheckedAll);
      redraw();
      redrawSelectAll();
    });
  }

  redrawSelectAll();

  function updateData(filter) {
    markFiltered($header, filter && filter.length > 0 && filter.length < trData.length);
    column.setFilter(filter);
  }

  $popup.select('.cancel').on('click', function () {
    updateData(bak);
    column.setMapping(range);
    $popup.remove();
  });
  $popup.select('.reset').on('click', function () {
    trData.forEach((d) => {
      d.isChecked = true;
      d.range = 50;
    });
    redraw();
    updateData(null);
    column.setMapping(trData.map(() => 1));
  });
  $popup.select('.ok').on('click', function () {
    let f = trData.filter((d) => d.isChecked).map((d) => d.cat);
    if (f.length === trData.length) {
      f = [];
    }
    updateData(f);
    column.setMapping(trData.map((d) => d.range / 100));
    $popup.remove();
  });
}

/**
 * returns all known filter dialogs mappings by type
 * @return
 */
export function filterDialogs() {
  return {
    string: openStringFilter,
    categorical: openCategoricalFilter,
    number: openMappingEditor,
    ordinal: openCategoricalMappingEditor,
    boolean: openBooleanFilter
  };
}
