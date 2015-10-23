var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
var Progressive;
(function (Progressive) {
    var Schedule = (function () {
        function Schedule(Name, Type, Start, End, DOW, Open, Pref, shiftBidClassField, val6Field, important) {
            if (typeof Name === "undefined") { Name = ''; }
            if (typeof Type === "undefined") { Type = ''; }
            if (typeof Start === "undefined") { Start = ''; }
            if (typeof End === "undefined") { End = ''; }
            if (typeof DOW === "undefined") { DOW = ''; }
            if (typeof Open === "undefined") { Open = 0; }
            if (typeof Pref === "undefined") { Pref = 0; }
            if (typeof shiftBidClassField === "undefined") { shiftBidClassField = ''; }
            if (typeof val6Field === "undefined") { val6Field = ''; }
            if (typeof important === "undefined") { important = false; }
            this.Name = Name;
            this.Type = Type;
            this.Start = Start;
            this.End = End;
            this.DOW = DOW;
            this.Open = Open;
            this.Pref = Pref;
            this.shiftBidClassField = shiftBidClassField;
            this.val6Field = val6Field;
            this.important = important;
        }
        return Schedule;
    })();
    Progressive.Schedule = Schedule;

    var BaseStorage = (function () {
        function BaseStorage($storage) {
            this.$storage = $storage;
        }
        BaseStorage.prototype.set = function (key, value) {
            this.$storage.setItem(key, value);
        };

        BaseStorage.prototype.get = function (key, defaultValue) {
            return this.$storage.getItem(key) || defaultValue;
        };

        BaseStorage.prototype.setObject = function (key, value) {
            this.$storage.setItem(key, JSON.stringify(value));
        };

        BaseStorage.prototype.getObject = function (key) {
            var inStorage = this.get(key, null);
            if (!inStorage)
                return null;
            return JSON.parse(inStorage);
        };
        return BaseStorage;
    })();

    var LocalStorage = (function (_super) {
        __extends(LocalStorage, _super);
        function LocalStorage($window) {
            _super.call(this, $window.localStorage);
        }
        LocalStorage.prototype.getPrintData = function () {
            return this.getObject('print-data');
        };
        LocalStorage.prototype.setPrintData = function (data) {
            this.setObject('print-data', data);
        };

        LocalStorage.prototype.getSaveData = function () {
            return this.getObject('save-data');
        };
        LocalStorage.prototype.setSaveData = function (data) {
            this.setObject('save-data', data);
        };

        LocalStorage.prototype.getSaveSearches = function () {
            return this.getObject('searches');
        };
        LocalStorage.prototype.setSaveSearches = function (data) {
            this.setObject('searches', data);
        };
        return LocalStorage;
    })(BaseStorage);

    var SessionStorage = (function (_super) {
        __extends(SessionStorage, _super);
        function SessionStorage($window) {
            _super.call(this, $window.sessionStorage);
        }
        return SessionStorage;
    })(BaseStorage);

    angular.module('progressiveWebStorage', []).factory('$localstorage', [
        '$window', function ($window) {
            return new LocalStorage($window);
        }]).factory('$sessionstorage', [
        '$window', function ($window) {
            return new SessionStorage($window);
        }]);
})(Progressive || (Progressive = {}));
//# sourceMappingURL=progressiveWebStorage.js.map
