/*global
 App, angular, IS_NATIVE_APP
 */

/**
 * Location, location and coordinates should be acquired fast,
 * we are using timeouts and promise to send answer as fast as possible.
 *
 * @author Xtraball SAS
 *
 */
angular.module('starter').service('Location', function ($cordovaGeolocation, $q) {
    var service = {
        debug: true,
        lastFetch: null,
        position: null,
        isEnabled: null,
    };

    /**
     * Default timeout is 10 seconds
     *
     * @param config
     * @param force
     * @returns {*|promise}
     */
    service.getLocation = function (config, force) {
        var deferred = $q.defer();
        var isResolved = false;

        var localForce = (force !== undefined);

        var localConfig = angular.extend({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }, config);

        var localRequestLocation = function (deferred) {
            if (!localForce && (service.lastFetch !== null) && ((service.lastFetch + 42000) > Date.now())) {
                // fresh poll, send direct
                deferred.resolve(service.position);
                isResolved = true;
            }

            $cordovaGeolocation
            .getCurrentPosition(localConfig)
            .then(function (position) {
                service.lastFetch = Date.now();
                service.position = position;
                if (service.debug) {
                    console.log("position ok", position);
                }
                if (!isResolved) {
                    deferred.resolve(service.position);
                }
            }, function () {
                if (service.debug) {
                    console.log("position ko");
                }
                if (!isResolved) {
                    deferred.reject();
                }
            });
        };

        var localReject = function (deferred) {
            // Disable for all next requests!
            service.isEnabled = false;
            deferred.reject();
        };

        if (service.isEnabled === false) {
            if (service.debug) {
                console.log("service disabled");
            }
            deferred.reject();
        } else {
            if (cordova.plugins.permissions !== undefined) {
                var permissions = cordova.plugins.permissions;
                permissions.checkPermission(
                    permissions.ACCESS_FINE_LOCATION,
                    function(status) {
                        if (status.hasPermission) {
                            localRequestLocation(deferred);
                        } else {
                            permissions.requestPermission(
                                permissions.ACCESS_FINE_LOCATION,
                                function (success) {
                                    localRequestLocation(deferred);
                                }, function (error) {
                                    localReject(deferred);
                                });
                        }
                    }, function (error) {
                        permissions.requestPermission(
                            permissions.ACCESS_FINE_LOCATION,
                            function (success) {
                                localRequestLocation(deferred);
                            }, function (error) {
                                localReject(deferred);
                            });
                    });
            } else {
                localRequestLocation(deferred);
            }
        }

        return deferred.promise;
    };

    /**
     * Returns the latest fetch position, if there is one, or false
     *
     * @returns {null}
     */
    service.getLatest = function () {
        var deferred = $q.defer();

        if (service.lastFetch === null) {
            // Try to fetch it!
            service.getLocation()
                .then(function (position) {
                    deferred.resolve(position);
                }, function () {
                    deferred.reject(false);
                });
        } else {
            deferred.resolve(service.position);
        }

        return deferred.promise;
    };

    return service;
});
