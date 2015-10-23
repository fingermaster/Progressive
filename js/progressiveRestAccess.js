/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
var Progressive;
(function (Progressive) {
    var RestAccess = (function () {
        function RestAccess($http, $q, baseUrl) {
            this.$http = $http;
            this.$q = $q;
            this.baseUrl = baseUrl;
        }
        RestAccess.prototype.getShiftBids = function (ShiftBid, EmpSK) {
            var that = this;
            return this.$http.get(this.baseUrl + '/api/GetShiftBidData?EmpSK=' + EmpSK + '&ShiftBid=' + ShiftBid).then(function (results) {
                return results.data;
            });
        };
        RestAccess.prototype.saveShiftBids = function (data) {
            var that = this;
            return this.$http.post(this.baseUrl + '/api/ShiftBidRanking', data).then(function (result) {
                if (result.data) {
                    if (result.data.ErrorCode != "NO_ERROR") {
                        return that.$q.reject(result.data.ErrorDescription);
                    }
                }
            });
        };
        return RestAccess;
    })();

    angular.module('progressiveApp').factory('restAccess', [
        '$http', '$q', 'baseUrl', function ($http, $q, baseUrl) {
            return new RestAccess($http, $q, baseUrl);
        }]);
})(Progressive || (Progressive = {}));
//# sourceMappingURL=progressiveRestAccess.js.map
