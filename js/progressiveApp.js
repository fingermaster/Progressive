var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../typings/underscore/underscore.d.ts"/>
/// <reference path="./custom-methods.d.ts"/>
/// <reference path="./progressiveWebStorage.ts"/>
/// <reference path="./progressiveRestAccess.ts"/>
var Progressive;
(function (Progressive) {
    var RestData = (function () {
        function RestData() {
        }
        return RestData;
    })();

    var RedoUndo = (function () {
        function RedoUndo(undoStack, filteredContainer, otherContainer, rankedContainer) {
            this.undoStack = undoStack;
            this.filteredContainer = filteredContainer;
            this.otherContainer = otherContainer;
            this.rankedContainer = rankedContainer;
            this._actionHistory = [];
            this._redoHistory = [];
            filteredContainer.setRedoUndo(this);
            otherContainer.setRedoUndo(this);
            rankedContainer.setRedoUndo(this);
        }
        RedoUndo.prototype.canUndo = function () {
            return this._actionHistory.length > 0;
        };

        RedoUndo.prototype.canRedo = function () {
            return this._redoHistory.length > 0;
        };

        RedoUndo.prototype.resetUndoRedo = function () {
            this._actionHistory = [];
            this._redoHistory = [];
        };

        RedoUndo.prototype.undo = function () {
            if (this._actionHistory.length > 0) {
                var lastItem = this._actionHistory.pop();
                this._redoHistory.push(this.getCurrentState());
                this.recoverCurrentState(lastItem);
            }
        };

        RedoUndo.prototype.redo = function () {
            if (this._redoHistory.length > 0) {
                var lastRedo = this._redoHistory.pop();
                this.recoverCurrentState(lastRedo);
                this._actionHistory = [];
            }
        };

        RedoUndo.prototype.saveHistory = function () {
            this._actionHistory.push(this.getCurrentState());
            if (this._actionHistory.length > this.undoStack) {
                this._actionHistory.shift(); //remove one
            }
        };

        RedoUndo.prototype.recoverCurrentState = function (state) {
            this.filteredContainer.setItems(angular.fromJson(state.filtered));
            this.otherContainer.setItems(angular.fromJson(state.other));
            this.rankedContainer.setItems(angular.fromJson(state.ranked));
        };

        RedoUndo.prototype.getCurrentState = function () {
            return {
                filtered: angular.toJson(this.filteredContainer.getItems()),
                other: angular.toJson(this.otherContainer.getItems()),
                ranked: angular.toJson(this.rankedContainer.getItems())
            };
        };
        return RedoUndo;
    })();

    var ScheduleContainer = (function () {
        function ScheduleContainer(_pageSize, $localstorage) {
            this._pageSize = _pageSize;
            this.$localstorage = $localstorage;
            this._Items = [];
            this._pageItems = [];
            this._sortingStack = [];
            this._reverseSort = false;
            this._pageNumber = 0;
        }
        ScheduleContainer.prototype.getTotalPage = function () {
            return Math.max(0, Math.floor((this._Items.length - 1) / this._pageSize));
        };

        ScheduleContainer.prototype.getPageNumber = function () {
            this._pageNumber = Math.min(this.getTotalPage(), this._pageNumber);
            return this._pageNumber + 1;
        };

        ScheduleContainer.prototype.getPagedItems = function () {
            if (this._Items.length == 0) {
                this._pageItems = [];
                return this._pageItems;
            }
            var startIndex = (this.getPageNumber() - 1) * this._pageSize;
            var endIndex = Math.min((startIndex + this._pageSize), this._Items.length);
            this._pageItems = this._Items.slice(startIndex, endIndex);
            return this._pageItems;
        };

        ScheduleContainer.prototype.firstPage = function () {
            this._pageNumber = 0;
        };

        ScheduleContainer.prototype.lastPage = function () {
            this._pageNumber = this.getTotalPage();
        };

        ScheduleContainer.prototype.nextPage = function () {
            this._pageNumber = Math.min(this.getTotalPage(), this._pageNumber + 1);
        };

        ScheduleContainer.prototype.previousPage = function () {
            this._pageNumber = Math.max(0, this._pageNumber - 1);
        };

        ScheduleContainer.prototype.sort = function (fieldName) {
            var that = this;
            var pad = '                    ';
            function realSort() {
                that._Items = _.sortBy(that._Items, function (item) {
                    var toReturn = '';
                    _.each(that._sortingStack, function (fieldName) {
                        toReturn = (item[fieldName].toString() + pad).slice(0, pad.length - 1) + toReturn;
                    });
                    return toReturn;
                });
            }
            if (!fieldName) {
                realSort();
                if (this._reverseSort) {
                    this._Items = this._Items.reverse();
                }
                return;
            }
            var isExisting = this._sortingStack.indexOf(fieldName);
            if (isExisting > -1) {
                //reverse sorting if it is the same click as last time
                if (isExisting == (this._sortingStack.length - 1)) {
                    this._reverseSort = !this._reverseSort;
                    this._Items = this._Items.reverse();
                    return;
                }
                this._sortingStack.splice(isExisting, 1);
            }
            this._reverseSort = false;
            this._sortingStack.push(fieldName);
            realSort();
        };

        ScheduleContainer.prototype.setRedoUndo = function (input) {
            this._redoUndo = input;
        };

        ScheduleContainer.prototype.getRedoUndo = function () {
            return this._redoUndo;
        };

        ScheduleContainer.prototype.moveOut = function (item) {
            this._Items.splice(this._Items.indexOf(item), 1);
        };

        ScheduleContainer.prototype.moveIn = function (item) {
            this._Items.push(item);
        };

        ScheduleContainer.prototype.getItems = function () {
            return this._Items;
        };

        ScheduleContainer.prototype.setItems = function (items) {
            this._Items = items;
        };
        return ScheduleContainer;
    })();

    var FilteredScheduleContainer = (function (_super) {
        __extends(FilteredScheduleContainer, _super);
        function FilteredScheduleContainer(pageSize, $localstorage) {
            _super.call(this, pageSize, $localstorage);
        }
        FilteredScheduleContainer.prototype.setRankedSchedules = function (ranked) {
            this._rankedSchedules = ranked;
        };

        FilteredScheduleContainer.prototype.moveRight = function (item) {
            this.getRedoUndo().saveHistory();
            this.moveOut(item);
            this._rankedSchedules.moveIn(item);
            this.getPagedItems();
            this._rankedSchedules.getPagedItems();
        };
        return FilteredScheduleContainer;
    })(ScheduleContainer);

    var OtherScheduleContainer = (function (_super) {
        __extends(OtherScheduleContainer, _super);
        function OtherScheduleContainer(pageSize, $localstorage) {
            _super.call(this, pageSize, $localstorage);
        }
        OtherScheduleContainer.prototype.setRankedSchedules = function (ranked) {
            this._rankedSchedules = ranked;
        };

        OtherScheduleContainer.prototype.moveRight = function (item) {
            this.getRedoUndo().saveHistory();
            this.moveOut(item);
            this._rankedSchedules.moveIn(item);
        };
        return OtherScheduleContainer;
    })(ScheduleContainer);

    var RankedScheduleContainer = (function (_super) {
        __extends(RankedScheduleContainer, _super);
        function RankedScheduleContainer(pageSize, $localstorage, filteredContainer, otherContainer) {
            _super.call(this, pageSize, $localstorage);
            this.filteredContainer = filteredContainer;
            this.otherContainer = otherContainer;
            this._lastNumberOfSchedule = null;
            this._cachedPages = [];
            filteredContainer.setRankedSchedules(this);
            otherContainer.setRankedSchedules(this);
            this.actionHistory = [];
            this.redoHistory = [];
        }
        RankedScheduleContainer.prototype.ranked = function () {
            return _.reduce(this.getItems(), function (memo, num) {
                return memo + num.Open;
            }, 0);
        };

        RankedScheduleContainer.prototype.getMyIndex = function (item) {
            return this._Items.indexOf(item);
        };

        RankedScheduleContainer.prototype.getRanks = function () {
            if (this._Items.length != this._lastNumberOfSchedule) {
                this._lastNumberOfSchedule = this.getItems().length;
                this._cachedPages = [];
                for (var i = 1; i <= this._lastNumberOfSchedule; i++) {
                    this._cachedPages.push(i);
                }
                this.normalizeRanks();
            }
            return this._cachedPages;
        };

        RankedScheduleContainer.prototype.normalizeRanks = function () {
            for (var i = 0; i < this._Items.length; i++) {
                this._Items[i].Pref = i + 1;
            }
        };

        RankedScheduleContainer.prototype.cutIn = function (item) {
            this.getRedoUndo().saveHistory();
            item.Pref += (this._Items.indexOf(item) > (item.Pref - 1) ? -0.5 : 0.5);
            this._Items = _.sortBy(this._Items, function (item) {
                return item.Pref;
            });
            this.normalizeRanks();
            this.setImportant(this._Items.indexOf(item));
        };

        RankedScheduleContainer.prototype.clearRanks = function () {
            for (var i = 0; i < this._Items.length; i++) {
                this._Items[i].Pref = 0;
            }
        };

        RankedScheduleContainer.prototype.setLastFiltered = function (items) {
            this.lastFiltered = items;
        };

        RankedScheduleContainer.prototype.moveOut = function (item) {
            _super.prototype.moveOut.call(this, item);
            this.normalizeRanks();
        };

        RankedScheduleContainer.prototype.moveIn = function (item) {
            _super.prototype.moveIn.call(this, item);
            this.normalizeRanks();
        };

        RankedScheduleContainer.prototype.sort = function (fieldName) {
            _super.prototype.sort.call(this, fieldName);
            this.normalizeRanks();
        };

        RankedScheduleContainer.prototype.moveLeft = function (item, isTrackingHistory) {
            if (typeof isTrackingHistory === "undefined") { isTrackingHistory = true; }
            if (isTrackingHistory) {
                this.getRedoUndo().saveHistory();
            }
            item.Pref = 0;
            this.moveOut(item);
            if (_.any(this.lastFiltered, function (loopItem) {
                return loopItem.Name == item.Name;
            })) {
                this.filteredContainer.moveIn(item);
                this.filteredContainer.sort(null);
            } else {
                this.otherContainer.moveIn(item);
                this.otherContainer.sort(null);
            }
        };

        RankedScheduleContainer.prototype.clear = function () {
            var that = this;
            this.clearRanks();
            this.getRedoUndo().saveHistory();
            _.each(_.map(this.getItems(), function (item) {
                return item.Name;
            }), function (nameToRemove) {
                that.moveLeft(_.find(that.getItems(), function (item) {
                    return item.Name == nameToRemove;
                }), false);
            });
        };

        /* resetUndoRedo() {
        this.actionHistory =[];
        this.redoHistory = [];
        }
        
        undo() {
        if (this.actionHistory.length>0) {
        var lastItem = this.actionHistory.pop();
        this.redoHistory.push(angular.toJson(this.getItems()));
        this.setItems(angular.fromJson(lastItem));
        }
        }
        
        redo() {
        if (this.redoHistory.length >0 ) {
        var lastRedo = this.redoHistory.pop();
        this.setItems(angular.fromJson(lastRedo));
        this.actionHistory=[];
        }
        }
        
        saveHistory() {
        this.actionHistory.push(angular.toJson(this.getItems()));
        } */
        RankedScheduleContainer.prototype.moveUp = function (item) {
            var index = this.getItems().indexOf(item);
            if (index > 0) {
                this.getRedoUndo().saveHistory();
                var temp = this.getItems()[index];
                this.getItems()[index] = this.getItems()[index - 1];
                this.getItems()[index - 1] = temp;
            }
            this.normalizeRanks();
            this.setImportant(index - 1);
        };

        RankedScheduleContainer.prototype.setImportant = function (toSetIndex) {
            _.forEach(this.getItems(), function (item, index) {
                item.important = (toSetIndex == index);
            });
        };

        RankedScheduleContainer.prototype.moveDown = function (item) {
            var index = this.getItems().indexOf(item);
            if (index < this.getItems().length - 1) {
                this.getRedoUndo().saveHistory();
                var temp = this.getItems()[index];
                this.getItems()[index] = this.getItems()[index + 1];
                this.getItems()[index + 1] = temp;
            }
            this.normalizeRanks();
            this.setImportant(index + 1);
        };
        return RankedScheduleContainer;
    })(ScheduleContainer);

    var SearchContainer = (function () {
        function SearchContainer(RootViewModel, $localStorage) {
            this.RootViewModel = RootViewModel;
            this.$localStorage = $localStorage;
            this.isSearchValid = true;
            this.search = {};
        }
        SearchContainer.prototype.populateFilter = function () {
            var that = this;
            var dow = '';
            var dowOriginal = [];
            var longDay, isOff;
            jQuery('.day-off-container .the-day').each(function (index, item) {
                longDay = jQuery(item).find('.day-name').text();
                isOff = (jQuery(item).css('display') == 'block');
                if (isOff) {
                    dow += ',';
                    dowOriginal.push(longDay.toLowerCase());
                } else {
                    dow += dayOfWeekMap[longDay];
                }
            });
            this.search.DOW = this.isElementVisible('.day-off-container') ? dow : null;
            this.search.DOWOriginal = dowOriginal;
            var filters = [];
            jQuery('.type-container .the-type').each(function (index, item) {
                if (jQuery(item).css('display') == 'block') {
                    filters.push(jQuery(item).find('.type-name').text());
                }
            });
            this.search.types = this.isElementVisible('.type-container') ? filters : null;
            this.search.start = this.isElementVisible('.start-container') ? jQuery('#start-time').val() : null; //databinding is not working.
            this.search.end = this.isElementVisible('.end-container') ? jQuery('#end-time').val() : null;
        };

        SearchContainer.prototype.resetFilters = function (populateAllTypes) {
            if (typeof populateAllTypes === "undefined") { populateAllTypes = false; }
            resetFilters();
            if (populateAllTypes) {
                _.each(this.allTypes(), function (item) {
                    addDaysOrTypesSelection(item);
                });
            }
        };

        SearchContainer.prototype.resetFiltersAndSearch = function () {
            this.resetFilters(true);
            this.RootViewModel.otherSchedules.setItems(this.RootViewModel.otherSchedules.getItems().concat(this.RootViewModel.filteredResults.getItems()));
            this.RootViewModel.filteredResults.setItems([]);
            this.RootViewModel.otherSchedules.sort(null);
        };

        SearchContainer.prototype.openSearchBox = function () {
            this.searchName = '';
            this.isSearchValid = true;
        };

        SearchContainer.prototype.saveSearch = function () {
            this.isSearchValid = this.searchName && this.searchName.trim().length > 0;
            if (!this.isSearchValid) {
                alert('name is required');
                return;
            }
            this.populateFilter();
            var saved = this.$localStorage.getSaveSearches();
            var searches = (angular.isArray(saved) ? saved : []);
            var toSave = angular.copy(this.search);
            toSave.name = this.searchName;
            searches = _.filter(searches, function (item) {
                return item.name != toSave.name;
            });
            searches.push(toSave);
            this.$localStorage.setSaveSearches(searches);
            this._cachedSearches = searches;
            closeAny();
        };

        SearchContainer.prototype.getSearches = function () {
            if (!this._cachedSearches) {
                this._cachedSearches = this.$localStorage.getSaveSearches();
            }
            return this._cachedSearches;
        };

        SearchContainer.prototype.populateSearch = function (search) {
            this.resetFilters();
            if (search.start) {
                addStartContainer();
                jQuery('#start-time').val(search.start);
            }
            if (search.end) {
                addEndContainer();
                jQuery('#end-time').val(search.end);
            }
            if (search.DOW) {
                addDayOffContainer();
                _.each(search.DOWOriginal, function (item) {
                    addDaysOrTypesSelection(item);
                });
            }
            if (search.types) {
                addTypeContainer();
                _.each(search.types, function (item) {
                    addDaysOrTypesSelection(item);
                });
            }
            closeAny();
        };

        SearchContainer.prototype.filter = function () {
            var that = this;
            this.populateFilter();
            var newFilteredResult = _.filter(this.RootViewModel.restData.schedules, function (item) {
                if (that.search.start) {
                    if (!item.Start)
                        return false;
                    if (item.Start.toLowerCase().replace(/ /g, '').indexOf(that.search.start) == -1) {
                        return false;
                    }
                }
                if (that.search.end) {
                    if (!item.End)
                        return false;
                    if (item.End.toLowerCase().replace(/ /g, '').indexOf(that.search.end) == -1) {
                        return false;
                    }
                }
                if (that.search.DOW) {
                    if (item.DOW != that.search.DOW) {
                        return false;
                    }
                }
                if (that.search.types) {
                    if (that.search.types.length > 0) {
                        if (!_.any(that.search.types, function (type) {
                            return type == item.Type;
                        })) {
                            return false;
                        }
                    }
                }
                if (!that.search.start && !that.search.end && !that.search.DOW && !that.search.types)
                    return false;
                return true;
            });

            //set three tables
            this.RootViewModel.filteredResults.setItems(_.filter(newFilteredResult, function (item) {
                return !_.any(that.RootViewModel.rankedSchedules.getItems(), function (innerItem) {
                    return innerItem.Name == item.Name;
                });
            }));

            this.RootViewModel.otherSchedules.setItems(_.filter(that.RootViewModel.restData.schedules, function (item) {
                return !_.any(that.RootViewModel.rankedSchedules.getItems(), function (innerItem) {
                    return innerItem.Name == item.Name;
                }) && !_.any(that.RootViewModel.filteredResults.getItems(), function (innerItem) {
                    return innerItem.Name == item.Name;
                });
            }));

            //reset undo and redo
            this.RootViewModel.redoUndo.resetUndoRedo();

            // set last filtered
            this.RootViewModel.rankedSchedules.setLastFiltered(newFilteredResult);
        };

        SearchContainer.prototype.allTypes = function () {
            return _.uniq(_.map(this.RootViewModel.restData.schedules, function (schedule) {
                return schedule.Type;
            }));
        };

        SearchContainer.prototype.isElementVisible = function (locator) {
            return !(jQuery(locator).css('display') == 'none');
        };
        return SearchContainer;
    })();

    var dayOfWeekMap = {
        Sun: 'S',
        Mon: 'M',
        Tue: "T",
        Wed: "W",
        Thu: "R",
        Fri: "F",
        Sat: "Y"
    };

    var RootViewModel = (function () {
        function RootViewModel(pageSize, undoStack, restAccess, restData, $localStorage, $timeout) {
            this.restAccess = restAccess;
            this.restData = restData;
            this.$localStorage = $localStorage;
            this.$timeout = $timeout;
            var that = this;
            this.filteredResults = new FilteredScheduleContainer(pageSize, $localStorage);
            this.otherSchedules = new OtherScheduleContainer(pageSize, $localStorage);
            this.rankedSchedules = new RankedScheduleContainer(pageSize * 1000, $localStorage, this.filteredResults, this.otherSchedules);
            this.redoUndo = new RedoUndo(undoStack, this.filteredResults, this.otherSchedules, this.rankedSchedules);
            var rankedCached = $localStorage.getSaveData() ? $localStorage.getSaveData().ranked : [];
            var rankedInCacheOrSaved = _.filter(_.map(restData.schedules, function (item) {
                var cached = _.find(rankedCached, function (inneritem) {
                    return (inneritem.Name == item.Name);
                });
                if (cached) {
                    return cached;
                }
                if (!!item.Pref) {
                    return item;
                }
                ;
                return null;
            }), function (notNull) {
                return !!notNull;
            });
            this.rankedSchedules.setItems(_.sortBy(angular.copy(rankedInCacheOrSaved), function (item) {
                return item.Pref;
            })); // we make a copy here
            this.rankedSchedules.normalizeRanks();
            this.otherSchedules.setItems(angular.copy(_.filter(restData.schedules, function (item) {
                return !_.any(rankedInCacheOrSaved, function (inneritem) {
                    return inneritem.Name == item.Name;
                });
            }))); // we make a copy here

            this.search = new SearchContainer(this, $localStorage);
            $timeout(function () {
                clearLoader();
                that.search.resetFilters(true);
            }, 1);
        }
        RootViewModel.prototype.rankLeft = function () {
            return this.restData.targetRank - this.rankedSchedules.ranked();
        };

        RootViewModel.prototype.saveForPrint = function () {
            this.$localStorage.setPrintData({ filtered: this.filteredResults.getItems(), other: this.otherSchedules.getItems(), ranked: this.rankedSchedules.getItems() });
        };

        RootViewModel.prototype.save = function () {
            var toSave = {};
            var that = this;
            startLoader();
            toSave.firstNameField = this.restData.firstName;
            toSave.lastNameField = this.restData.lastName;
            toSave.rankField = Number(this.restData.targetRank);
            toSave.empSKField = this.restData.empSKField;
            toSave.shiftBidField = this.restData.shiftBidField;
            toSave.classDataField = _.filter(_.map(this.restData.schedules, function (schedule) {
                var toAdd = {};
                toAdd.nameField = schedule.Name;
                var ranked = _.find(that.rankedSchedules.getItems(), function (rankedSchedule) {
                    return rankedSchedule.Name == schedule.Name;
                });

                /* if (ranked) {
                if (ranked.Pref != schedule.Pref) {
                toAdd.rankField = ranked.Pref;
                } else {
                return null;
                }
                } else {
                if (schedule.Pref !=0 ) {
                toAdd.rankField = 0;
                } else {
                return null;
                }
                } */
                toAdd.rankField = (ranked ? ranked.Pref : 0);
                toAdd.val4Field = schedule.Start;
                toAdd.val5Field = schedule.End;
                toAdd.val3Field = schedule.DOW;
                toAdd.val1Field = schedule.Type;
                toAdd.val2Field = schedule.Open;
                toAdd.val6Field = schedule.val6Field;
                toAdd.shiftBidClassField = schedule.shiftBidClassField;
                return toAdd;
            }), function (item) {
                return item != null;
            });
            if (this.rankLeft() < 0) {
                this.$localStorage.setSaveData({ ranked: this.rankedSchedules.getItems() });
                this.restAccess.saveShiftBids(toSave).then(function () {
                    that.$localStorage.setSaveData([]);
                    clearLoader();
                }, function (err) {
                    clearLoader();
                    alert('An error occurred while saving your schedules: ' + (angular.isObject(err) ? angular.toJson(err) : err.toString()));
                });
            } else {
                this.$localStorage.setSaveData({ ranked: this.rankedSchedules.getItems() });
                clearLoader();
            }
        };
        return RootViewModel;
    })();
    angular.module('progressiveApp', ['ui.router', 'ngAnimate', 'progressiveWebStorage']).constant('pageSize', 10).constant('undoStack', 5).config(function ($stateProvider, $urlRouterProvider, mode) {
        $urlRouterProvider.otherwise('/');
        $stateProvider.state("root", {
            url: "/:ShiftBid/:EmpSK",
            resolve: {
                restData: [
                    'restAccess', '$stateParams', function (restAccess, $stateParams) {
                        startLoader();
                        var toReturn = new RestData();
                        if (mode == 'test') {
                            toReturn.firstName = 'yuhang';
                            toReturn.lastName = 'sun';
                            toReturn.targetRank = 20;
                            toReturn.schedules = [
                                new Progressive.Schedule('CL1_128', '4x9+44', '9:00 AM;10:00 PM', '5:00pm', 'S,,,,,,', 1, 0),
                                new Progressive.Schedule('CL1_129', '4x9+43', '9:00am', '5:00pm', 'S,TWRFY', 2, 0),
                                new Progressive.Schedule('CL1_130', '2X11', '9:00am', '5:00pm', 'SM,,RFY', 3, 0),
                                new Progressive.Schedule('CL1_131', '4x12', '9:00am', '5:00pm', 'SMTWRFY', 4, 0),
                                new Progressive.Schedule('CL1_132', 'split', '9:00am', '5:00pm', 'SMTWRFY', 5, 0),
                                new Progressive.Schedule('CL1_133', '4x9+45', '9:00am', '5:00pm', 'SMTWRFY', 6, 0),
                                new Progressive.Schedule('CL1_141', '4x13', '9:00am', '5:00pm', 'SMTWRFY', 7, 0),
                                new Progressive.Schedule('CL1_142', 'split', '9:00am', '5:00pm', 'SMTWRFY', 8, 0),
                                new Progressive.Schedule('CL1_143', '4x9+41', '9:00am', '5:00pm', 'S,,,RFY', 9, 0),
                                new Progressive.Schedule('CL1_151', '4x9+42', '9:00am', '5:00pm', 'SMTWRFY', 9, 0)
                            ];
                            return toReturn;
                        } else {
                            return restAccess.getShiftBids($stateParams.ShiftBid, $stateParams.EmpSK).then(function (resultData) {
                                toReturn.firstName = resultData.firstNameField;
                                toReturn.lastName = resultData.lastNameField;
                                toReturn.targetRank = Number(resultData.rankField);
                                toReturn.empSKField = resultData.empSKField;
                                toReturn.shiftBidField = resultData.shiftBidField;
                                toReturn.schedules = _.map(resultData.classDataField, function (schedule) {
                                    var toAdd = new Progressive.Schedule();
                                    toAdd.Name = schedule.nameField;
                                    toAdd.Pref = Number(schedule.rankField);
                                    toAdd.Start = schedule.val4Field;
                                    toAdd.End = schedule.val5Field;
                                    toAdd.DOW = schedule.val3Field;
                                    toAdd.Type = schedule.val1Field;
                                    toAdd.Open = Number(schedule.val2Field);
                                    toAdd.shiftBidClassField = schedule.shiftBidClassField;
                                    toAdd.val6Field = schedule.val6Field;
                                    return toAdd;
                                });
                                return toReturn;
                            }, function (err) {
                                alert('An error occurred while getting your schedules: ' + (angular.isObject(err) ? angular.toJson(err) : err.toString()));
                                toReturn.schedules = [];
                                return toReturn;
                            });
                        }
                    }]
            },
            controller: [
                '$scope', 'pageSize', 'undoStack', 'restAccess', 'restData', '$localstorage', '$timeout', function ($scope, pageSize, undoStack, restAccess, restData, $localstorage, $timeout) {
                    $scope.rootViewModel = new RootViewModel(pageSize, undoStack, restAccess, restData, $localstorage, $timeout);
                }]
        });
    });
})(Progressive || (Progressive = {}));
//# sourceMappingURL=progressiveApp.js.map
