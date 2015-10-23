/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../typings/underscore/underscore.d.ts"/>
/// <reference path="./custom-methods.d.ts"/>
/// <reference path="./progressiveWebStorage.ts"/>
/// <reference path="./progressiveRestAccess.ts"/>
/// <reference path="./progressiveApp.ts"/>
var Progressive;
(function (Progressive) {
    angular.module('progressivePrintApp', ['ui.router', 'progressiveWebStorage']).config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider.state("root", {
            url: "/:type",
            resolve: {
                schedules: [
                    '$localstorage', '$stateParams', function ($localstorage, $stateParams) {
                        return $localstorage.getPrintData()[$stateParams.type];
                    }]
            },
            controller: [
                '$scope', 'schedules', '$stateParams', function ($scope, schedules, $stateParams) {
                    $scope.schedules = schedules;
                    $scope.type = $stateParams.type.substr(0, 1).toUpperCase() + $stateParams.type.substr(1);
                }]
        });
    });
})(Progressive || (Progressive = {}));
//# sourceMappingURL=progressivePrintApp.js.map
