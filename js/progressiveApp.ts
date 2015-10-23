/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../typings/underscore/underscore.d.ts"/>
/// <reference path="./custom-methods.d.ts"/>
/// <reference path="./progressiveWebStorage.ts"/>
/// <reference path="./progressiveRestAccess.ts"/>
module Progressive {

    class RestData {
        public schedules:Schedule[];
        public firstName:string;
        public lastName:string;
        public targetRank:number;
        public empSKField:string;
        public shiftBidField:string;
    }

    class RedoUndo {
        private _actionHistory:IStateSnapshot[] = [];
        private _redoHistory:IStateSnapshot[] = [];

        constructor(private undoStack:number,private filteredContainer:FilteredScheduleContainer, private otherContainer:OtherScheduleContainer, private rankedContainer:RankedScheduleContainer) {
            filteredContainer.setRedoUndo(this);
            otherContainer.setRedoUndo(this);
            rankedContainer.setRedoUndo(this);
        }

        canUndo():boolean {
            return this._actionHistory.length > 0;
        }

        canRedo():boolean {
            return this._redoHistory.length > 0;
        }

        resetUndoRedo() {
            this._actionHistory = [];
            this._redoHistory = [];
        }

        undo() {
            if (this._actionHistory.length > 0) {
                var lastItem = this._actionHistory.pop();
                this._redoHistory.push(this.getCurrentState());
                this.recoverCurrentState(lastItem)
            }
        }

        redo() {
            if (this._redoHistory.length > 0) {
                var lastRedo = this._redoHistory.pop();
                this.recoverCurrentState(lastRedo);
                this._actionHistory = [];
            }
        }

        saveHistory() {
            this._actionHistory.push(this.getCurrentState());
            if (this._actionHistory.length > this.undoStack) {
                this._actionHistory.shift(); //remove one
            }
        }

        recoverCurrentState(state:IStateSnapshot) {
            this.filteredContainer.setItems(angular.fromJson(state.filtered));
            this.otherContainer.setItems(angular.fromJson(state.other));
            this.rankedContainer.setItems(angular.fromJson(state.ranked));
        }

        getCurrentState():IStateSnapshot {
            return {
                filtered: angular.toJson(this.filteredContainer.getItems()),
                other: angular.toJson(this.otherContainer.getItems()),
                ranked: angular.toJson(this.rankedContainer.getItems())
            }
        }

    }

    class ScheduleContainer {

        public _Items:Schedule[] = [];
        private _pageItems:Schedule[] = [];
        private _redoUndo:RedoUndo;
        private _sortingStack:string[] = [];
        private _reverseSort:boolean = false;
        private _pageNumber:number = 0;


        constructor(private _pageSize:number, private $localstorage:ILocalStorage) {
        }

        getTotalPage() {
            return Math.max(0, Math.floor((this._Items.length - 1) / this._pageSize));
        }

        getPageNumber() {
            this._pageNumber = Math.min(this.getTotalPage(), this._pageNumber);
            return this._pageNumber +1;
        }

        getPagedItems():Schedule[] {
            if (this._Items.length == 0) {
                this._pageItems = [];
                return this._pageItems;
            }
            var startIndex = (this.getPageNumber()-1) * this._pageSize;
            var endIndex = Math.min((startIndex + this._pageSize), this._Items.length);
            this._pageItems = this._Items.slice(startIndex, endIndex);
            return this._pageItems;
        }

        firstPage() {
            this._pageNumber = 0;
        }

        lastPage() {
            this._pageNumber = this.getTotalPage();
        }

        nextPage() {
            this._pageNumber = Math.min(this.getTotalPage(), this._pageNumber + 1);
        }

        previousPage() {
            this._pageNumber = Math.max(0, this._pageNumber - 1);
        }

        sort(fieldName:string) {
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
                if (this._reverseSort)
                { this._Items = this._Items.reverse(); }
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
        }

        setRedoUndo(input:RedoUndo) {
            this._redoUndo = input;
        }

        getRedoUndo():RedoUndo {
            return this._redoUndo;
        }

        moveOut(item:Schedule) {
            this._Items.splice(this._Items.indexOf(item), 1);
        }

        moveIn(item:Schedule) {
            this._Items.push(item);
        }


        getItems() {
            return this._Items;
        }

        setItems(items) {
            this._Items = items;
        }


    }

    class FilteredScheduleContainer extends ScheduleContainer {


        private _rankedSchedules:RankedScheduleContainer;

        setRankedSchedules(ranked:RankedScheduleContainer) {
            this._rankedSchedules = ranked;
        }

        constructor(pageSize:number, $localstorage:ILocalStorage) {
            super(pageSize, $localstorage);
        }


        moveRight(item:Schedule) {
            this.getRedoUndo().saveHistory();
            this.moveOut(item);
            this._rankedSchedules.moveIn(item);
            this.getPagedItems();
            this._rankedSchedules.getPagedItems();
        }

    }

    class OtherScheduleContainer extends ScheduleContainer {
        private _rankedSchedules:RankedScheduleContainer;

        setRankedSchedules(ranked:RankedScheduleContainer) {
            this._rankedSchedules = ranked;
        }

        constructor(pageSize:number, $localstorage:ILocalStorage) {
            super(pageSize, $localstorage);
        }

        moveRight(item:Schedule) {
            this.getRedoUndo().saveHistory();
            this.moveOut(item);
            this._rankedSchedules.moveIn(item);
        }

    }

    class RankedScheduleContainer extends ScheduleContainer {
        private actionHistory:any[];
        private redoHistory:any[];
        private lastFiltered:Schedule[];
        private _lastNumberOfSchedule:number = null;
        private _cachedPages = [];


        constructor(pageSize:number, $localstorage:ILocalStorage, private filteredContainer:FilteredScheduleContainer, private otherContainer:OtherScheduleContainer) {
            super(pageSize, $localstorage);
            filteredContainer.setRankedSchedules(this);
            otherContainer.setRankedSchedules(this);
            this.actionHistory = [];
            this.redoHistory = [];

        }

        ranked() {
            return _.reduce(this.getItems(), function (memo, num:Schedule) {
                return memo + num.Open;
            }, 0);
        }

        getMyIndex(item) {
            return this._Items.indexOf(item);
        }

        getRanks() {
            if (this._Items.length != this._lastNumberOfSchedule) {
                this._lastNumberOfSchedule = this.getItems().length;
                this._cachedPages = [];
                for (var i = 1; i <= this._lastNumberOfSchedule; i++) {
                    this._cachedPages.push(i);
                }
                this.normalizeRanks();
            }
            return this._cachedPages;
        }

        normalizeRanks() {
            for (var i = 0; i < this._Items.length; i++) {
                this._Items[i].Pref = i + 1;
            }
        }

        cutIn(item) {
            this.getRedoUndo().saveHistory();
            item.Pref += (this._Items.indexOf(item) > (item.Pref - 1) ? -0.5 : 0.5);
            this._Items = _.sortBy(this._Items, function (item:Schedule) {
                return item.Pref;
            });
            this.normalizeRanks();
            this.setImportant(this._Items.indexOf(item));
        }

        clearRanks() {
            for (var i = 0; i < this._Items.length; i++) {
                this._Items[i].Pref = 0;
            }
        }

        setLastFiltered(items:Schedule[]) {
            this.lastFiltered = items;
        }

        moveOut(item) {
            super.moveOut(item);
            this.normalizeRanks();
        }

        moveIn(item) {
            super.moveIn(item);
            this.normalizeRanks();
        }

        sort(fieldName:string) {
            super.sort(fieldName);
            this.normalizeRanks();
        }


        moveLeft(item:Schedule, isTrackingHistory:boolean = true) {
            if (isTrackingHistory) {
                this.getRedoUndo().saveHistory();
            }
            item.Pref = 0;
            this.moveOut(item);
            if (_.any(this.lastFiltered, function (loopItem:Schedule) {
                    return loopItem.Name == item.Name
                })) {
                this.filteredContainer.moveIn(item);
                this.filteredContainer.sort(null);
            } else {
                this.otherContainer.moveIn(item);
                this.otherContainer.sort(null);
            }
        }

        clear() {
            var that = this;
            this.clearRanks();
            this.getRedoUndo().saveHistory();
            _.each(_.map(this.getItems(), function (item:Schedule) {
                return item.Name;
            }), function (nameToRemove) {
                that.moveLeft(_.find(that.getItems(), function (item:Schedule) {
                    return item.Name == nameToRemove;
                }), false);
            })

        }

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

        moveUp(item:Schedule) {
            var index = this.getItems().indexOf(item);
            if (index > 0) {
                this.getRedoUndo().saveHistory();
                var temp = this.getItems()[index];
                this.getItems()[index] = this.getItems()[index - 1];
                this.getItems()[index - 1] = temp;
            }
            this.normalizeRanks();
            this.setImportant(index-1);
        }

        setImportant(toSetIndex:number) {
            _.forEach(this.getItems(), function(item, index) {
                    item.important = (toSetIndex == index)
            })
        }

        moveDown(item:Schedule) {
            var index = this.getItems().indexOf(item);
            if (index < this.getItems().length - 1) {
                this.getRedoUndo().saveHistory();
                var temp = this.getItems()[index];
                this.getItems()[index] = this.getItems()[index + 1];
                this.getItems()[index + 1] = temp;
            }
            this.normalizeRanks();
            this.setImportant(index+1);
        }



    }

    class SearchContainer {
        public searchName:string;
        public isSearchValid:boolean = true;
        public search:ISearch = <ISearch>{};
        private _cachedSearches;

        constructor(private RootViewModel:RootViewModel, private $localStorage:ILocalStorage) {

        }

        populateFilter() {
            var that = this;
            var dow = '';
            var dowOriginal:string[] = [];
            var longDay, isOff;
            jQuery('.day-off-container .the-day').each(
                function (index, item:any) {
                    longDay = jQuery(item).find('.day-name').text();
                    isOff = (jQuery(item).css('display') == 'block');
                    if (isOff) {
                        dow += ',';
                        dowOriginal.push(longDay.toLowerCase());
                    } else {
                        dow += dayOfWeekMap[longDay];
                    }
                })
            this.search.DOW = this.isElementVisible('.day-off-container') ? dow : null;
            this.search.DOWOriginal =<string[]> dowOriginal;
            var filters:string[] = [];
            jQuery('.type-container .the-type').each(function (index, item:any) {
                if (jQuery(item).css('display') == 'block') {
                    filters.push(jQuery(item).find('.type-name').text());
                }
            })
            this.search.types = this.isElementVisible('.type-container') ? filters : null;
            this.search.start = this.isElementVisible('.start-container') ? jQuery('#start-time').val() : null; //databinding is not working.
            this.search.end = this.isElementVisible('.end-container') ? jQuery('#end-time').val() : null;
        }

        resetFilters(populateAllTypes:boolean=false) {
            resetFilters();
            if (populateAllTypes) {
                _.each(this.allTypes(), function (item) {
                    addDaysOrTypesSelection(item);
                })
            }
        }

        resetFiltersAndSearch() {
            this.resetFilters(true);
            this.RootViewModel.otherSchedules.setItems(this.RootViewModel.otherSchedules.getItems().concat(this.RootViewModel.filteredResults.getItems()));
            this.RootViewModel.filteredResults.setItems([]);
            this.RootViewModel.otherSchedules.sort(null);
        }

        openSearchBox() {
            this.searchName = '';
            this.isSearchValid = true;
        }

        saveSearch() {
            this.isSearchValid = this.searchName && this.searchName.trim().length > 0;
            if (!this.isSearchValid) {
                alert('name is required');
                return;
            }
            this.populateFilter();
            var saved = this.$localStorage.getSaveSearches();
            var searches:ISearch[] = (angular.isArray(saved) ? saved : []);
            var toSave:ISearch = angular.copy(this.search);
            toSave.name = this.searchName;
            searches = _.filter(searches, function (item) {
                return item.name != toSave.name;
            })
            searches.push(toSave);
            this.$localStorage.setSaveSearches(searches);
            this._cachedSearches = searches;
            closeAny();
        }

        getSearches():ISearch[] {
            if (!this._cachedSearches) {
                this._cachedSearches = this.$localStorage.getSaveSearches();
            }
            return this._cachedSearches;
        }

        populateSearch(search:ISearch) {
            this.resetFilters();
            if (search.start) {
                addStartContainer();
                jQuery('#start-time').val(search.start)
            }
            if (search.end) {
                addEndContainer();
                jQuery('#end-time').val(search.end)
            }
            if (search.DOW) {
                addDayOffContainer();
                _.each(search.DOWOriginal, function (item) {
                    addDaysOrTypesSelection(item);
                })
            }
            if (search.types) {
                addTypeContainer();
                _.each(search.types, function (item) {
                    addDaysOrTypesSelection(item);
                })
            }
            closeAny();
        }

        filter() {
            var that = this;
            this.populateFilter();
            var newFilteredResult = _.filter(this.RootViewModel.restData.schedules, function (item:Schedule) {
                if (that.search.start) {
                    if (!item.Start) return false;
                    if (item.Start.toLowerCase().replace(/ /g, '').indexOf(that.search.start) ==-1) {
                        return false;
                    }
                }
                if (that.search.end) {
                    if (!item.End) return false;
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
                if (!that.search.start && !that.search.end && !that.search.DOW && !that.search.types) return false;
                return true;
            });

            //set three tables
            this.RootViewModel.filteredResults.setItems(_.filter(newFilteredResult, function (item:Schedule) {
                return !_.any(that.RootViewModel.rankedSchedules.getItems(), function (innerItem:Schedule) {
                    return innerItem.Name == item.Name;
                })
            }));

            this.RootViewModel.otherSchedules.setItems(_.filter(that.RootViewModel.restData.schedules, function (item:Schedule) {
                return !_.any(that.RootViewModel.rankedSchedules.getItems(), function (innerItem:Schedule) {
                        return innerItem.Name == item.Name;
                    }) && !_.any(that.RootViewModel.filteredResults.getItems(), function (innerItem:Schedule) {
                        return innerItem.Name == item.Name;
                    })
            }));

            //reset undo and redo
            this.RootViewModel.redoUndo.resetUndoRedo();
            // set last filtered
            this.RootViewModel.rankedSchedules.setLastFiltered(newFilteredResult);

        }

        allTypes():string[] {
            return _.uniq(_.map(this.RootViewModel.restData.schedules, function (schedule:Schedule) {
                    return schedule.Type;
                })
            );
        }

        isElementVisible(locator:string) {
            return !(jQuery(locator).css('display') == 'none');
        }

    }

    interface IStateSnapshot {
        filtered:string;other:string;ranked:string
    }

    var dayOfWeekMap = {
        Sun: 'S',
        Mon: 'M',
        Tue: "T",
        Wed: "W",
        Thu: "R",
        Fri: "F",
        Sat: "Y"
    }


    class RootViewModel {
        constructor(pageSize:number, undoStack:number, public restAccess:IRestAccess, public restData:RestData, private $localStorage:ILocalStorage,private $timeout:ng.ITimeoutService) {
            var that = this;
            this.filteredResults = new FilteredScheduleContainer(pageSize, $localStorage);
            this.otherSchedules = new OtherScheduleContainer(pageSize, $localStorage);
            this.rankedSchedules = new RankedScheduleContainer(pageSize * 1000, $localStorage, this.filteredResults, this.otherSchedules);
            this.redoUndo = new RedoUndo(undoStack, this.filteredResults, this.otherSchedules, this.rankedSchedules);
            var rankedCached = $localStorage.getSaveData()?$localStorage.getSaveData().ranked:[];
            var rankedInCacheOrSaved =_.filter(_.map(restData.schedules, function(item:Schedule) {
                var cached =_.find(rankedCached, function(inneritem:Schedule) {
                    return (inneritem.Name == item.Name) ;
                });
                if (cached) { return cached;}
                if (!!item.Pref) {return item;};
                return null;
            }),function(notNull) {
                return !!notNull;
            });
            this.rankedSchedules.setItems(_.sortBy(angular.copy(rankedInCacheOrSaved), function(item:Schedule) {return item.Pref})); // we make a copy here
            this.rankedSchedules.normalizeRanks();
            this.otherSchedules.setItems(angular.copy(
                _.filter(restData.schedules,
                    function(item:Schedule) {
                        return !_.any(rankedInCacheOrSaved, function(inneritem:Schedule) {
                            return inneritem.Name == item.Name;
                        })
                    }))); // we make a copy here

            this.search = new SearchContainer(this, $localStorage);
            $timeout(function () {
                clearLoader();
                that.search.resetFilters(true);
            }, 1);
        }

        filteredResults:FilteredScheduleContainer;
        otherSchedules:OtherScheduleContainer;
        rankedSchedules:RankedScheduleContainer;
        redoUndo:RedoUndo;
        search:SearchContainer;

        rankLeft() {
            return this.restData.targetRank - this.rankedSchedules.ranked();
        }

        saveForPrint() {
            this.$localStorage.setPrintData({filtered:this.filteredResults.getItems(),other:this.otherSchedules.getItems(),ranked:this.rankedSchedules.getItems()});
        }

        save() {
            var toSave:IResultDataForGet = <any> {};
            var that = this;
            startLoader();
            toSave.firstNameField = this.restData.firstName;
            toSave.lastNameField = this.restData.lastName;
            toSave.rankField = Number(this.restData.targetRank);
            toSave.empSKField = this.restData.empSKField;
            toSave.shiftBidField = this.restData.shiftBidField;
            toSave.classDataField =
              _.filter( _.map(this.restData.schedules, function (schedule:Schedule) {
                    var toAdd:IResultDataForGetClassDataField = <any> {};
                    toAdd.nameField = schedule.Name;
                    var ranked = _.find(that.rankedSchedules.getItems(), function (rankedSchedule:Schedule) {
                        return rankedSchedule.Name == schedule.Name
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
                    toAdd.rankField =(ranked ? ranked.Pref : 0);
                    toAdd.val4Field = schedule.Start;
                    toAdd.val5Field = schedule.End;
                    toAdd.val3Field = schedule.DOW;
                    toAdd.val1Field = schedule.Type;
                    toAdd.val2Field = schedule.Open;
                    toAdd.val6Field = schedule.val6Field;
                    toAdd.shiftBidClassField = schedule.shiftBidClassField;
                    return toAdd;
                }), function(item) {
                  return item != null
              });
            if (this.rankLeft()<0) {
                this.$localStorage.setSaveData(<any>{ranked:this.rankedSchedules.getItems()});
                this.restAccess.saveShiftBids(toSave)
                    .then(
                    function(){
                        that.$localStorage.setSaveData(<any>[]);
                        clearLoader();
                    },
                    function(err) {
                        clearLoader();
                        alert('An error occurred while saving your schedules: '+ (angular.isObject(err)? angular.toJson(err):err.toString()));
                    })
            } else {
                this.$localStorage.setSaveData(<any>{ranked:this.rankedSchedules.getItems()});
                clearLoader();
            }


        }
    }
    angular.module('progressiveApp', ['ui.router', 'ngAnimate','progressiveWebStorage'])
        .constant('pageSize', 10)
        .constant('undoStack',5)
        .config(function ($stateProvider:ng.ui.IStateProvider, $urlRouterProvider:ng.ui.IUrlRouterProvider, mode:string) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state("root", {
                    url: "/:ShiftBid/:EmpSK",
                    resolve: {
                        restData: ['restAccess', '$stateParams',function (restAccess:IRestAccess, $stateParams) {
                            startLoader();
                            var toReturn = new RestData();
                            if (mode == 'test') {
                                toReturn.firstName = 'yuhang';
                                toReturn.lastName = 'sun';
                                toReturn.targetRank = 20;
                                toReturn.schedules = [
                                    new Schedule('CL1_128', '4x9+44', '9:00 AM;10:00 PM', '5:00pm', 'S,,,,,,', 1, 0)
                                    ,
                                    new Schedule('CL1_129', '4x9+43', '9:00am', '5:00pm', 'S,TWRFY', 2, 0)
                                    ,
                                    new Schedule('CL1_130', '2X11', '9:00am', '5:00pm', 'SM,,RFY', 3, 0)
                                    ,
                                    new Schedule('CL1_131', '4x12', '9:00am', '5:00pm', 'SMTWRFY', 4, 0)
                                    ,
                                    new Schedule('CL1_132', 'split', '9:00am', '5:00pm', 'SMTWRFY', 5, 0)
                                    ,
                                    new Schedule('CL1_133', '4x9+45', '9:00am', '5:00pm', 'SMTWRFY', 6, 0)
                                    ,
                                    new Schedule('CL1_141', '4x13', '9:00am', '5:00pm', 'SMTWRFY', 7, 0)
                                    ,
                                    new Schedule('CL1_142', 'split', '9:00am', '5:00pm', 'SMTWRFY', 8, 0)
                                    ,
                                    new Schedule('CL1_143', '4x9+41', '9:00am', '5:00pm', 'S,,,RFY', 9, 0)
                                    ,
                                    new Schedule('CL1_151', '4x9+42', '9:00am', '5:00pm', 'SMTWRFY', 9, 0)
                                ];
                                return <any>toReturn;
                            } else {
                                return restAccess.getShiftBids($stateParams.ShiftBid, $stateParams.EmpSK)
                                    .then(function (resultData:IResultDataForGet) {
                                        toReturn.firstName = resultData.firstNameField;
                                        toReturn.lastName = resultData.lastNameField;
                                        toReturn.targetRank = Number(resultData.rankField);
                                        toReturn.empSKField = resultData.empSKField;
                                        toReturn.shiftBidField = resultData.shiftBidField;
                                        toReturn.schedules = _.map(resultData.classDataField, function (schedule:IResultDataForGetClassDataField) {
                                            var toAdd = new Schedule();
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
                                    },
                                    function (err) {
                                        alert('An error occurred while getting your schedules: '+ (angular.isObject(err)? angular.toJson(err):err.toString()));
                                        toReturn.schedules = [];
                                        return toReturn;
                                    });
                            }
                        }]
                    },
                    controller: ['$scope', 'pageSize','undoStack', 'restAccess', 'restData', '$localstorage', '$timeout', function ($scope, pageSize, undoStack, restAccess:IRestAccess, restData:RestData, $localstorage:ILocalStorage, $timeout) {
                        $scope.rootViewModel = new RootViewModel(pageSize, undoStack, restAccess, restData, $localstorage, $timeout);
                    }]
                })

        })

}
