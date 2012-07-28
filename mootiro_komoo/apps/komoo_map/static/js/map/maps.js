(function() {
  var AjaxEditor, AjaxMap, Editor, Map, Preview, _base,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (window.komoo == null) window.komoo = {};

  if ((_base = window.komoo).event == null) _base.event = google.maps.event;

  Map = (function() {

    Map.prototype.googleMapDefaultOptions = {
      zoom: 12,
      center: new google.maps.LatLng(-23.55, -46.65),
      disableDefaultUI: false,
      streetViewControl: true,
      scaleControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      scaleControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
        style: google.maps.ScaleControlStyle.DEFAULT
      },
      mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID]
      },
      mapTypeId: google.maps.MapTypeId.HYBRID
    };

    function Map(options) {
      this.options = options != null ? options : {};
      this.element = document.getElementById(this.options.elementId);
      this.features = komoo.collections.makeFeatureCollectionPlus({
        map: this
      });
      this.components = {};
      this.initGoogleMap(this.options.googleMapOptions);
      this.initFeatureTypes();
      this.handleEvents();
      if (this.options.geojson) this.loadGeoJSON(this.options.geojson, true);
    }

    Map.prototype.initGoogleMap = function(options) {
      if (options == null) options = this.googleMapDefaultOptions;
      return this.googleMap = new google.maps.Map(this.element, options);
    };

    Map.prototype.initFeatureTypes = function() {
      var _ref,
        _this = this;
      if (this.featureTypes == null) this.featureTypes = {};
      return (_ref = this.options.featureTypes) != null ? _ref.forEach(function(type) {
        return _this.featureTypes[type.type] = type;
      }) : void 0;
    };

    Map.prototype.handleEvents = function() {};

    Map.prototype.addComponent = function(component, type) {
      var _base2;
      if (type == null) type = 'generic';
      component.setMap(this);
      if ((_base2 = this.components)[type] == null) _base2[type] = [];
      this.components[type].push(component);
      return typeof component.enable === "function" ? component.enable() : void 0;
    };

    Map.prototype.enableComponents = function(type) {
      var _ref,
        _this = this;
      return (_ref = this.components[type]) != null ? _ref.forEach(function(component) {
        return typeof component.enable === "function" ? component.enable() : void 0;
      }) : void 0;
    };

    Map.prototype.disableComponents = function(type) {
      var _ref,
        _this = this;
      return (_ref = this.components[type]) != null ? _ref.forEach(function(component) {
        return typeof component.disable === "function" ? component.disable() : void 0;
      }) : void 0;
    };

    Map.prototype.clear = function() {
      this.features.removeAllFromMap();
      return this.features.clear();
    };

    Map.prototype.refresh = function() {
      return google.maps.event.trigger(this.googleMap, 'resize');
    };

    Map.prototype.saveLocation = function(center, zoom) {
      if (center == null) center = this.googleMap.getCenter();
      if (zoom == null) zoom = this.getZoom();
      komoo.utils.createCookie('lastLocation', center.toUrlValue(), 90);
      return komoo.utils.createCookie('lastZoom', zoom, 90);
    };

    Map.prototype.goToSavedLocation = function() {
      var center, lastLocation, zoom;
      lastLocation = komoo.utils.readCookie('lastLocation');
      zoom = parseInt(komoo.utils.readCookie('lastZoom'), 10);
      if (lastLocation && zoom) {
        if (typeof console !== "undefined" && console !== null) {
          console.log('Getting location from cookie...');
        }
        lastLocation = lastLocation.split(',');
        center = new google.maps.LatLng(lastLocation[0], lastLocation[1]);
        this.googleMap.setCenter(center);
        this.googleMap.setZoom(zoom);
      }
      return true;
    };

    false;

    Map.prototype.goToUserLocation = function() {
      var clientLocation, pos,
        _this = this;
      if (clientLocation = google.loader.ClientLocation) {
        pos = new google.maps.LatLng(clientLocation.latitude, clientLocation.longitude);
        this.googleMap.setCenter(pos);
        if (typeof console !== "undefined" && console !== null) {
          console.log('Getting location from Google...');
        }
      }
      if (navigator.geolocation) {
        return navigator.geolocation.getCurrentPosition(function(position) {
          pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          _this.googleMap.setCenter(pos);
          return typeof console !== "undefined" && console !== null ? console.log('Getting location from navigator.geolocation...') : void 0;
        }, function() {
          return typeof console !== "undefined" && console !== null ? console.log('User denied access to navigator.geolocation...') : void 0;
        });
      }
    };

    Map.prototype.handleFeatureEvents = function(feature) {
      var eventsNames,
        _this = this;
      eventsNames = ['mouseover', 'mouseout', 'mousemove', 'click', 'dblclick'];
      return eventsNames.forEach(function(eventName) {
        return komoo.event.addListener(feature, eventName, function(e) {
          return komoo.event.trigger(_this, "feature_" + eventName, e, feature);
        });
      });
    };

    Map.prototype.makeFeature = function(geojson) {
      var feature;
      feature = komoo.features.makeFeature(geojson, this.featureTypes);
      this.handleFeatureEvents(feature);
      this.features.push(feature);
      komoo.event.trigger(this, 'feature_created', feature);
      return feature;
    };

    Map.prototype.getFeatures = function() {
      return this.features;
    };

    Map.prototype.getFeaturesByType = function(type, categories, strict) {
      return this.features.getByType(type, categories, strict);
    };

    Map.prototype.showFeaturesByType = function(type, categories, strict) {
      var _ref;
      return (_ref = this.getFeaturesByType(type, categories, strict)) != null ? _ref.show() : void 0;
    };

    Map.prototype.hideFeaturesByType = function(type, categories, strict) {
      var _ref;
      return (_ref = this.getFeaturesByType(type, categories, strict)) != null ? _ref.hide() : void 0;
    };

    Map.prototype.showFeatures = function(features) {
      if (features == null) features = this.features;
      return features.show();
    };

    Map.prototype.hideFeatures = function(features) {
      if (features == null) features = this.features;
      return features.hide();
    };

    Map.prototype.loadGeoJSON = function(geojson, panTo, attach) {
      var features, _ref, _ref2,
        _this = this;
      if (panTo == null) panTo = false;
      if (attach == null) attach = true;
      if (!((geojson != null ? geojson.type : void 0) != null)) return [];
      if (!geojson.type === 'FeatureCollection') return [];
      features = komoo.collections.makeFeatureCollection({
        map: this
      });
      if ((_ref = geojson.features) != null) {
        _ref.forEach(function(geojsonFeature) {
          var feature;
          feature = _this.features.getById(geojsonFeature.properties.type, geojsonFeature.properties.id);
          if (feature == null) feature = _this.makeFeature(geojsonFeature);
          features.push(feature);
          if (attach) return feature.setMap(_this);
        });
      }
      if (panTo && ((_ref2 = features.getAt(0)) != null ? _ref2.getBounds() : void 0)) {
        this.googleMap.fitBounds(features.getAt(0).getBounds());
      }
      return features;
    };

    Map.prototype.getGeoJSON = function(options) {
      var list;
      if (options == null) options = {};
      if (options.newOnly == null) options.newOnly = false;
      if (options.currentOnly == null) options.currentOnly = false;
      if (options.geometryCollection == null) options.geometryCollection = false;
      list = options.newOnly ? this.newFeatures : options.currentOnly ? komoo.collections.makeFeatureCollection({
        map: this.map,
        features: [this.currentFeature]
      }) : this.features;
      return list.getGeoJson({
        geometryCollection: options.geometryCollection
      });
    };

    Map.prototype.getBounds = function() {
      return this.googleMap.getBounds();
    };

    Map.prototype.getZoom = function() {
      return this.googleMap.getZoom();
    };

    return Map;

  })();

  Editor = (function(_super) {

    __extends(Editor, _super);

    function Editor() {
      Editor.__super__.constructor.apply(this, arguments);
    }

    return Editor;

  })(Map);

  Preview = (function(_super) {

    __extends(Preview, _super);

    function Preview() {
      Preview.__super__.constructor.apply(this, arguments);
    }

    Preview.prototype.googleMapDefaultOptions = {
      zoom: 12,
      center: new google.maps.LatLng(-23.55, -46.65),
      disableDefaultUI: true,
      streetViewControl: false,
      scaleControl: true,
      scaleControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
        style: google.maps.ScaleControlStyle.DEFAULT
      },
      mapTypeId: google.maps.MapTypeId.HYBRID
    };

    return Preview;

  })(Map);

  AjaxMap = (function(_super) {

    __extends(AjaxMap, _super);

    function AjaxMap(options) {
      AjaxMap.__super__.constructor.call(this, options);
      this.addComponent(komoo.maptypes.makeCleanMapType(), 'mapType');
      this.addComponent(komoo.providers.makeFeatureProvider(), 'provider');
      this.addComponent(komoo.controls.makeTooltip(), 'tooltip');
      this.addComponent(komoo.controls.makeInfoWindow(), 'infoWindow');
      this.addComponent(komoo.controls.makeFeatureClusterer({
        featureType: "Community"
      }, 'clusterer'));
      this.addComponent(komoo.controls.makeSupporterBox());
      this.addComponent(komoo.controls.makeLicenseBox());
    }

    return AjaxMap;

  })(Map);

  AjaxEditor = (function(_super) {

    __extends(AjaxEditor, _super);

    function AjaxEditor(options) {
      AjaxEditor.__super__.constructor.call(this, options);
      this.addComponent(komoo.controls.makeDrawingManager());
    }

    return AjaxEditor;

  })(AjaxMap);

  window.komoo.maps = {
    Map: Map,
    Preview: Preview,
    AjaxMap: AjaxMap,
    makeMain: function(options) {
      if (options == null) options = {};
      return new AjaxEditor(options);
    },
    makeView: function(options) {
      if (options == null) options = {};
      return new AjaxMap(options);
    },
    makeEditor: function(options) {
      if (options == null) options = {};
      return new AjaxEditor(options);
    },
    makePreview: function(options) {
      if (options == null) options = {};
      return new Preview(options);
    }
  };

}).call(this);