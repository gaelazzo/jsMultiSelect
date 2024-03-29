'use strict';
/**
 * provides a mechanism to make multiple select with a single sql command
 * @module optimizeComparing
 */
const util = require('util');
var _ = require('lodash');

var $dq = require('jsDataQuery');


/**
 * Used to compose query
 * @class MultiCompare
 */


/**
 * Multi compare is a class indicating the comparison of n given fields with n given values
 * @method MultiCompare
 * @param {String[]} fields
 * @param {object[]} values
 * @constructor
 */
function MultiCompare(fields, values) {
  this.fields = fields;
  this.values = values;
}

MultiCompare.prototype = {
  constructor: MultiCompare,
  /**
   * List of fields to compare
   * @public
   * @property fields
   * @type String[]
   **/
  fields:null,

  /**
   * List of values to match
   * @public
   * @property values
   * @type Object[]
   **/
  values:null,

  /**
   * checks if this has same comparison fields of another multi compare
   * @method sameFieldsAs
   * @param {MultiCompare} multiComp
   * @returns {boolean}
   */
  sameFieldsAs : function(multiComp) {
    return _.isEqual(this.fields, multiComp.fields);
  }
};





/**
 * Optimized multi compare. It is a multi-field-comparator that eventually has multiple values for some field.
 * @class OptimizedMultiCompare
 */



/**
 * creates an OptimizedMultiCompare starting from a MultiCompare
 * @param {MultiCompare} multiComp
 * @constructor
 */
function OptimizedMultiCompare(multiComp) {
  this.fields= multiComp.fields;
  this.multiValPosition = null;
  this.multiValArray = null;
  this.values = _.clone(multiComp.values);
}


OptimizedMultiCompare.prototype = {
  constructor: OptimizedMultiCompare,

  /**
   * @public
   * @property fields
   * @type String[]
   */
  fields: null,

  /**
   * @public
   * @property  multiValPosition
   * @type int|null
   */
  multiValPosition: null,

  /**
   * @public
   * @property values
   * @type String[]|null
   */
  values: null,

  /**
   * @public
   * @property  multiValArray
   * @type object[]|null
   */
  multiValArray: null,

  /**
   * checks if this is a simple comparator or multi-value comparator
   * @public
   * @method isMultiValue
   * @returns {boolean}
   */
  isMultiValue: function () {
    return this.multiValPosition !== null;
  },

  /**
   * Gets the overall filter for this multi select
   * @method getFilter
   * @public
   * @returns {sqlFun}
   */
  getFilter: function () {
    if (!this.isMultiValue) {
      return $dq.mcmp(this.fields, this.values);
    }
    var that = this;
    return $dq.and(_.map(this.fields, function (el, index) {
      if (index === that.multiValPosition) {
        return $dq.isIn(el, that.multiValArray);
      }
      return $dq.eq(el, that.values[index]);
    }));
  },


  /**
   * @method sameFieldsAs
   * @param {OptimizedMultiCompare} optimizedComparer
   * @returns {boolean}
   */
  sameFieldsAs: function (optimizedComparer) {
    return _.isEqual(this.fields, optimizedComparer.fields);
  },


  /**
   * check if this comparison has a specified value for the index-th field
   * @method hasValue
   * @param {object} value
   * @param {int} index
   * @returns {boolean}
   */
  hasValue: function (value, index) {
    if (index !== this.multiValPosition) {
      return this.values[index] === value;
    }
    return _.includes(this.multiValArray, value);
  },



  /***
   * Join this multicomparator with another one, if it is possible. Returns false if it is not possible.
   * @public
   * @method joinWith
   * @param  {OptimizedMultiCompare} other
   * @return {boolean}
   */
  joinWith: function (other) {
    var posDiff = null,
        len = this.fields.length,
        i;
    if (!this.sameFieldsAs(other)) {
      return false;
    }
    if (other.isMultiValue()) {
      return false;
    }
    if (this.multiValPosition === null) {
      //Checks there is 0 or 1 differences
      for (i = 0; i < len; i++) {
        if (!this.hasValue(other.values[i], i)) {
          if (posDiff !== null) {
            return false; //more than one difference was found
          }
          posDiff = i;
        }
      }
    } else {
      //there is already a multi value, so there must be at most a difference and it must be in  multiValPosition
      for (i = 0; i < len; i++) {
        if (!this.hasValue(other.values[i], i)) {
          if (i !== this.multiValPosition) {
            return false; //a difference was found not in desired position
          }
          posDiff = i;
        }
      }
    }
    if (posDiff === null) {
      return true;
    }
    if (posDiff === this.multiValPosition) {
      this.multiValArray.push(other.values[posDiff]);
      return true;
    }
    this.multiValPosition = posDiff;
    this.multiValArray = [this.values[posDiff], other.values[posDiff]];
    return true;
  }
};










/**
 * A class representing a single sql select command
 * @class Select
 */

/**
 * Creates a select providing an optional column list
 * @param {string} columnList
 * @constructor
 */
function Select(columnList) {
  /**
   * string containing the list  of all columns to read, usually comma separated
   * @public
   * @property {String} Select.columns
   */
  this.columns = columnList || '*';



  
  this.omc = null;

  this.isOptimized = false;



  this.staticF = null;



  this.filter = null;



  this.alias = null;
}



Select.prototype = {
  constructor: Select,
  /**
   * @public
   * @property omc
   * @type OptimizedMultiCompare|null
   */
  omc: null,

  /**
   * @public
   * @property  alias
   * @type string|null
   */
  alias: null,

  /**
   * @public
   * @property  filter
   * @type sqlFun
   */
  filter: null,


  /**
   * @public
   * @property staticF
   * @type sqlFun
   */
  staticF: null,

  /**
   * States if a Select is 'optimized', i.e. it is attached to a multicomparator. A select attached to a manual
   *  filter is considered not-optimized
   * @property  isOptimized
   * @type boolean
   */
  isOptimized: false,


  /**
   * Table to which this select is applied
   * @property tableName
   * @type String
   */
  tableName: null,

  /**
   * @property myTop
   * @protected
   * @type String
   */
  myTop: null,

  /**
   * get the partial filter (excluding static filter) associated with this Select
   * @method getPartialFilter
   * @return {sqlFun}
   */
  getPartialFilter: function () {
    if (this.filter) {
      return this.filter;
    }

    if (this.omc) {
      return this.omc.getFilter();
    }
    return null;
  },

  /**
   * Gets the overall filter for this multi select
   * @method getFilter
   * @returns {sqlFun}
   */
  getFilter: function () {
    if (this.staticF) {
      return $dq.and(this.staticF, this.getPartialFilter());
    }
    return this.getPartialFilter();
  },


  /**
   * Sets the table associated to this select
   * @method from
   * @param {string} tableName
   * @returns {Select}
   */
  from: function (tableName) {
    this.tableName = tableName;
    if (this.alias === null) {
      this.alias = tableName;
    }
    return this;
  },


  /**
   * sets the top options for the query
   * @method top
   * @param {string} [n]
   * @returns {string|Select}
   */
  top: function (n) {
    if (n !== undefined) {
      this.myTop = n;
      return this;
    }
    return this.myTop;
  },


  /**
   * Check if this Select can be appended to another one, i.e., has same tableName and alias
   * @method canAppendTo
   * @param {Select} other
   * @returns {boolean}
   */
  canAppendTo: function (other) {
    return this.tableName === other.tableName && this.alias === other.alias;
  },


  /**
   * Tries to append this Select to another one in an optimized way and returns true on success
   * An optimized Append is possible only if two select are both optimized
   * @method optimizedAppendTo
   * @param {Select} other
   * @returns {boolean}
   */
  optimizedAppendTo: function (other) {
    if (!this.canAppendTo(other)) {
      return false;
    }

    if (this.omc === null || other.omc === null) {
      return false;
    }
    if (!this.omc.joinWith(other.omc)) {
      return false;
    }
    this.filter = null;
    return true;
  },


  /**
   * appends this Select to another one or-joining their conditions, returns true if appending succeeded
   * @method appendTo
   * @param {Select} other
   * @returns {boolean}
   */
  appendTo: function (other) {
    if (!this.canAppendTo(other)) {
      return false;
    }

    if (this.getPartialFilter().isTrue) {
      return true;
    }
    if (other.getPartialFilter().isTrue) {
      this.omc = null;
      this.isOptimized = false;
      this.filter = other.getPartialFilter();
      return true;
    }

    if (this.getPartialFilter().toString() === other.getPartialFilter().toString()) {
      return true;
    }

    this.filter = $dq.or(this.getPartialFilter(), other.getPartialFilter());
    this.omc = null;
    this.isOptimized = false;
    return true;
  }


};






/**
 * sets the manual filter for this Select. We call this kind of filtering  not-optimized
 * @method where
 * @param {sqlFun} filter
 * @returns {Select} this
 */
Select.prototype.where = function(filter){
  this.filter = filter;
  this.isOptimized = false;
  return this;
};

/**
 * Sets a static filter for this condition
 * @param {sqlFun} filter
 * @returns {Select} this
 */
Select.prototype.staticFilter = function (filter) {
  this.staticF = filter;
  return this;
};


/**
 * Sets the filter as a multi comparator. Here we call it 'optimized'
 * @method multiCompare
 * @param {MultiCompare} multiComp
 * @returns {Select}
 */
Select.prototype.multiCompare = function (multiComp) {
  this.omc = new OptimizedMultiCompare(multiComp);
  this.isOptimized = true; /* alias for this.omc !== null */
  return this;
};



/**
 * Sets a destination table for this select (alias)
 * @method intoTable
 * @param {string} alias
 * @returns {Select}
 */
Select.prototype.intoTable = function(alias){
  this.alias = alias;
  return this;
};

/**
 * set the sorting for the select
 * @method orderBy
 * @param sorting
 * @returns {Select}
 */
Select.prototype.orderBy = function (sorting) {
  this.sorting = sorting;
  return this;
};




/**
 * Tries to group the selectList into res using the specified joinMethod.
 * @method groupSelect
 * @private
 * @param {Select[]} selectList
 * @param {string} joinMethod method to use to try the join. It is  'appendTo' or 'optimizedAppendTo'
 * @return {Select[]} array of joined Select
 */
function groupSelectStep(selectList,  joinMethod){
  var result = [];
  _.forEach(selectList,
      function (select) {
      if (!_.find(result,function(g){return g[joinMethod](select);})){
        result.push(select);
      }
    });
  return result;
}

/**
 * Takes a list of Select to same table and evaluates an equivalent Select joining all input filters
 * @method groupSelect
 * @param {Select[]} selectList
 */
function groupSelect(selectList){
  //try to group optimized Select each other with optimizedAppendTo
  var grouped = groupSelectStep(_.filter(selectList, {isOptimized:true}), 'optimizedAppendTo');

  //then group all the rest using appendTo
  return groupSelectStep(grouped.concat(_.filter(selectList, {isOptimized: false})), 'appendTo');
}


module.exports = {
  Select: Select,
  groupSelect: groupSelect,
  groupSelectStep: groupSelectStep, //exported only for unit testing
  MultiCompare: MultiCompare,
  OptimizedMultiCompare: OptimizedMultiCompare //exported only for unit testing
};
