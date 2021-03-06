/**
 * Created by Samuel Gratzl on 06.08.2015.
 */

import {merge} from '../utils';
import ValueColumn, {IValueColumnDesc} from './ValueColumn';
import NumberColumn from './NumberColumn';
import StringColumn from './StringColumn';
import StackColumn from './StackColumn';
import AnnotateColumn from './AnnotateColumn';
import BooleanColumn from './BooleanColumn';
import CategoricalColumn from './CategoricalColumn';
import MinColumn from './MinColumn';
import MaxColumn from './MaxColumn';
import MeanColumn from './MeanColumn';
import RankColumn from './RankColumn';
import SelectionColumn from './SelectionColumn';
import ScriptColumn from './ScriptColumn';
import CategoricalNumberColumn from './CategoricalNumberColumn';
import NestedColumn from './NestedColumn';
import DummyColumn from './DummyColumn';
import LinkColumn from './LinkColumn';
import SetColumn from './SetColumn';
import MultiValueColumn from './MultiValueColumn';
import BoxPlotColumn from './BoxPlotColumn';
import SmileColumn from './SmileColumn';


export {default as Column, IColumnDesc} from './Column';
export {default as CompositeColumn} from './CompositeColumn';
export {createMappingFunction, ScaleMappingFunction, ScriptMappingFunction, isNumberColumn} from './NumberColumn';
export {isCategoricalColumn} from './CategoricalColumn';
export {default as Ranking, isSupportType} from './Ranking';
export {createDesc as createMinDesc} from './MinColumn';
export {createDesc as createMaxDesc} from './MaxColumn';
export {createDesc as createMeanDesc} from './MeanColumn';
export {createDesc as createRankDesc} from './RankColumn';
export {createDesc as createSelectionDesc} from './SelectionColumn';
export {createDesc as createScriptDesc} from './ScriptColumn';
export {createDesc as createNestedDesc} from './NestedColumn';
export {createDesc as createStackDesc} from './StackColumn';

/**
 * defines a new column type
 * @param name
 * @param functions
 * @returns {CustomColumn}
 */
export function defineColumn<T>(name: string, functions: any = {}) {
  class CustomColumn extends ValueColumn<T> {
    constructor(id: string, desc: IValueColumnDesc<T>) {
      super(id, desc);
      if (typeof (this.init) === 'function') {
        this.init.apply(this, [].slice.apply(arguments));
      }
    }

    init() {
      // dummy
    }
  }
  CustomColumn.prototype.toString = () => name;
  CustomColumn.prototype = merge(CustomColumn.prototype, functions);

  return CustomColumn;
}


/**
 * utility for creating an action description with optional label
 * @param label
 * @returns {{type: string, label: string}}
 */
export function createActionDesc(label = 'actions') {
  return {type: 'actions', label};
}

/**
 * a map of all known column types
 */
export function models() {
  return {
    number: NumberColumn,
    string: StringColumn,
    link: LinkColumn,
    stack: StackColumn,
    rank: RankColumn,
    boolean: BooleanColumn,
    categorical: CategoricalColumn,
    ordinal: CategoricalNumberColumn,
    actions: DummyColumn,
    annotate: AnnotateColumn,
    selection: SelectionColumn,
    max: MaxColumn,
    min: MinColumn,
    mean: MeanColumn,
    script: ScriptColumn,
    nested: NestedColumn,
    multiValue: MultiValueColumn,
    set: SetColumn,
    boxplot: BoxPlotColumn,
    smile: SmileColumn
  };
}
