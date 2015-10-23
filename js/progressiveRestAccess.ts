/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
module Progressive {

    export interface IRestAccess {
        getShiftBids(ShiftBid:string,EmpSK:string):ng.IPromise<IResultDataForGet> ;
        saveShiftBids(data:IResultDataForGet):ng.IPromise<any> ;
    }

    export interface IResultDataForGetClassDataField {
        nameField:string;
        rankField:number;
        shiftBidClassField:string;
        val1Field:string;//type
        val2Field:number;//?
        val3Field:string;//?
        val4Field:string;//start
        val5Field:string;//end
        val6Field:string;//?
    }

    export interface IResultDataForGet {
        classDataField:IResultDataForGetClassDataField[];
        empSKField:string;
        firstNameField:string;
        lastNameField:string;
        rankField:number;
        shiftBidField:string;

    }



    class RestAccess implements  IRestAccess {
        constructor(private $http:ng.IHttpService, private $q:ng.IQService, private baseUrl:string) {
        }
        getShiftBids(ShiftBid:string,EmpSK:string):ng.IPromise<IResultDataForGet> {
            var that = this;
            return this.$http.get(this.baseUrl +'/api/GetShiftBidData?EmpSK='+EmpSK+'&ShiftBid='+ShiftBid)
            .then(function(results) {
                    return results.data;
                })

        }
        saveShiftBids(data:IResultDataForGet):ng.IPromise<any>  {
            var that = this;
            return this.$http.post(this.baseUrl +'/api/ShiftBidRanking',data)
                .then(function(result) {
                    if (result.data) {
                        if ((<any>result.data).ErrorCode != "NO_ERROR") {
                            return that.$q.reject((<any>result.data).ErrorDescription);
                        }
                    }
                }
               )
        }
    }

    angular.module('progressiveApp')
        .factory('restAccess', ['$http','$q','baseUrl', function ($http, $q, baseUrl) {
            return new RestAccess($http, $q, baseUrl);
        }])

}
