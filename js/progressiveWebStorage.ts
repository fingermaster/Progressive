/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
module Progressive {
    export  interface ISearch {
        name:string;
        start:string;
        end:string;
        types:string[];
        DOW:string;
        DOWOriginal:string[];
    }

    export class Schedule {

        constructor(public Name:string = '',
                    public Type:string = '',
                    public Start:string = '',
                    public End:string = '',
                    public DOW:string = '',
                    public Open:number = 0,
                    public Pref:number = 0,
                    public shiftBidClassField:string='',
                    public val6Field:string='',
                    public important:boolean = false) {

        }
    }

    export interface IScheduleCache {
        other:Schedule[];
        filtered:Schedule[];
        ranked:Schedule[];
    }




    export interface IStorage {
        set (key:string, value:string);
        get (key:string, defaultValue:string):string;
        setObject (key:string, value);
        getObject(key:string):any;
    }

    export interface ILocalStorage extends IStorage {
        getPrintData():IScheduleCache ;
        setPrintData(data:IScheduleCache);
        getSaveData():IScheduleCache ;
        setSaveData(data:IScheduleCache);
        getSaveSearches():ISearch[] ;
        setSaveSearches(data:ISearch[]);

    }

    class BaseStorage implements IStorage {
        constructor(private $storage:Storage) {

        }

        set(key:string, value:string) {
            this.$storage.setItem(key, value);
        }

        get(key:string, defaultValue:string):string {

            return this.$storage.getItem(key) || defaultValue;
        }

        setObject(key:string, value) {
            this.$storage.setItem(key, JSON.stringify(value));
        }

        getObject(key:string):any {
            var inStorage:string = this.get(key, null);
            if (!inStorage) return null;
            return JSON.parse(inStorage);
        }
    }

    class LocalStorage extends BaseStorage {
        constructor($window:ng.IWindowService) {
            super($window.localStorage);
        }

        getPrintData():IScheduleCache {
            return <IScheduleCache> this.getObject('print-data');
        }
        setPrintData(data:IScheduleCache) {
            this.setObject('print-data',data);
        }

        getSaveData():IScheduleCache {
            return <IScheduleCache> this.getObject('save-data');
        }
        setSaveData(data:IScheduleCache) {
            this.setObject('save-data',data);
        }

        getSaveSearches():ISearch[] {
            return <ISearch[]> this.getObject('searches');
        }
        setSaveSearches(data:ISearch[]) {
            this.setObject('searches',data);
        }
    }

    class SessionStorage extends BaseStorage {
        constructor($window:ng.IWindowService) {
            super($window.sessionStorage);
        }
    }

    angular.module('progressiveWebStorage',[])
        .factory('$localstorage', ['$window', function ($window) {
            return new LocalStorage($window);
        }])
        .factory('$sessionstorage', ['$window', function ($window) {
            return new SessionStorage($window);
        }]);

}
