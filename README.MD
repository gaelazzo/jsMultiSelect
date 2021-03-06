# jsMultiSelect
Creating optimized sql  SELECT commands to make multiple select with a single instruction



# MultiCompare Class#
MultiCompare is a class representing the comparison of n given fields with n given values.

## MultiCompare(fields,values) ##

 * @param {string[]} fields
 * @param {object[]} values
 * @returns {MultiCompare}

## sameFieldsAs(multiComp) ##

Checks if this MultiCompare has same comparison fields of another one.
  
 * @param multiComp
 * @returns {boolean}


# OptimizedMultiCompare #

OptimizedMultiCompare is a specialized MultiCompare class. An OptimizedMultiCompare instance is built merging multiple MultiCompare instances.

## OptimizedMultiCompare(multiComp) ##

Constructor for a OptimizedMultiCompare, accepting a MultiCompare as parameter.

* @param {MultiCompare} multiComp
* @returns {OptimizedMultiCompare}


## joinWith(other) ##

Join this multicomparator with another one, if it is possible. Returns false if it is not possible.

 * @param {OptimizedMultiCompare} other
 * @return {boolean}



# Select #
Class representing a query to be done on a table

## Select(columnList) ##

Creates a select providing an optional column list

 * @param {string[]} columnList
 * @return {Select}


## where(filter) ##

Sets the manual filter for this Select. We call this kind of filtering  "not-optimized"

 * @param {sqlFun} filter
 * returns {Select} this

sqlFun is a kind of object defined in  [jsDataQuery](https://github.com/gaelazzo/jsDataQuery "jsDataQuery")


## staticFilter(filter) ##

Sets an additional static filter for this query

* @param {sqlFun} filter
* @returns {Select} this

## multiCompare(multiComp) ##

Sets a multicompare filter for the Select
 
* @param {MultiCompare} multiComp
* @returns {Select} this

## from (tableName) ##
Sets the table associated to this select

 * @param {string} tableName
 * @returns {Select} this
 
Select.prototype.from = function (tableName)


##  intoTable(alias) ##
Sets a destination table for this select (alias)
 
 * @param {string} alias
 * @returns {Select} this
 
## orderBy(sorting) ##
Set the sorting method for the select
  
 * @param {string} sorting
 * @returns {Select} this
 
## top([n]) ##
Gets/Sets the top options for the query
 
 * @param {string} [n]
 * @returns {string | undefined}

## canAppendTo(other) ##
Check if this Select can be appended to another one, i.e., has same tableName and alias
 
 * @param {Select} other
 * @returns {boolean}

## optimizedAppendTo(other) ##
Tries to append this Select to another one in an optimized way and returns true on success.  An optimized Append is possible only if two select are both optimized
 
 * @param {Select} other
 * @returns {boolean}

## appendTo(other) ##
Appends this Select to another one or-joining their conditions, returns true if appending succeeded
 
 * @param {Select} other
 * @returns {boolean}



# groupSelect(selectList) #
This is a standalone function, which takes a list of Select to same table and evaluates an equivalent Select joining all their input filters



![](https://travis-ci.org/gaelazzo/jsMultiSelect.svg?branch=master)
