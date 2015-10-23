/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../typings/underscore/underscore.d.ts"/>
/// <reference path="./custom-methods.d.ts"/>
/// <reference path="./progressiveWebStorage.ts"/>
/// <reference path="./progressiveRestAccess.ts"/>
/// <reference path="./progressiveApp.ts"/>
module Progressive {
    angular.module('progressivePrintApp', ['ui.router', 'progressiveWebStorage'])
        .config(function ($stateProvider:ng.ui.IStateProvider, $urlRouterProvider:ng.ui.IUrlRouterProvider) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state("root", {
                    url: "/:type",
                    resolve: {
                        schedules: ['$localstorage', '$stateParams', function ($localstorage:ILocalStorage, $stateParams) {
                            return $localstorage.getPrintData()[$stateParams.type];
                        }]
                    },
                    controller: ['$scope', 'schedules','$stateParams', function ($scope, schedules:Schedule[],$stateParams) {
                        $scope.schedules = schedules;
                       $scope.type = $stateParams.type.substr(0,1).toUpperCase()+$stateParams.type.substr(1);
                    }]
                })
        })
}