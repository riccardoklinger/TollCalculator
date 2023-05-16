///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/Button', //creating the dijit button
  'dojo/on',  //handling events
  'dojo/keys', //listen for 'ENTER' press
  'dojo/date/locale',
  'dojo/parser', //constructing the button
  'dijit/registry', // accessing the text inputs
  'dojo/request', //making a CORS call / AJAX post
  'dojo/request/xhr', //making a CORS call / AJAX post
  'esri/geometry/Point', //storing point geometry
  'esri/symbols/SimpleMarkerSymbol', //show proper markers
  'esri/symbols/SimpleLineSymbol', //show proper line
  'esri/geometry/Polyline', //storing line geometry
  'esri/graphic', //for constructing a graphic
  'esri/graphicsUtils',
  'esri/layers/GraphicsLayer', //to store the graphic as a separate layer
  "esri/InfoTemplate",
  "dojo/store/Memory", //to deal with the datastore
  "dojo/data/ObjectStore",
  "dijit/form/ComboBox", //creating the Comboboxes
  "dijit/form/Select",
  "dojox/widget/Standby",
  'dojox/html/entities',
  'dojo/domReady!'],
  function (declare, BaseWidget, _WidgetsInTemplateMixin, Button, on, keys, locale, parser, registry, request, xhr,
    Point, SimpleMarkerSymbol, SimpleLineSymbol, Polyline, Graphic, graphicsUtils, GraphicsLayer, InfoTemplate, Memory, ObjectStore, ComboBox, Select, Standby, entities) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      // ORS DEMOWidget code goes here

      //please note that this property is be set by the framework when widget is loaded.
      //templateString: template,
      baseClass: 'jimu-widget-demo',

      postCreate: function () {
        this.inherited(arguments);

        console.log('postCreate');
      },



      startup: function () {
        this.inherited(arguments);

        var date1 = locale.format(new Date(), {
          selector: "date",
          datePattern: "yyyy-MM-dd HH:mm:ss.SSS+0000"
        });
        let date2 = date1.replace(" ", "T");
        date2 = encodeURIComponent(date2);
        var endpoints = {};
        request("https://www.maut.toll-collect.de/discovery/discovery/geoservices/serviceinfo?validFrom=" + date2).then(function (data) {
          console.log(JSON.parse(data));
          data = JSON.parse(data);
          console.log("accessing data")
          endpoints["geocodingAddress"] = data["geocodingAddress"].split('/services/')[1];
          console.log('https://www.maut.toll-collect.de/arcgis/rest/services/' + endpoints["geocodingAddress"] + '/suggest')
        }, function (err) {
          // handle an error condition
        }, function (evt) {
          // handle a progress event
        });
        //create weight dropdown:
        var weightStore = new Memory({
          data: [
            { id: "0", category: 7, label: "7.5t - 11.999t", zulGesamtGewicht: 11990 },
            { id: "1", category: 12, label: "12t - 18t", zulGesamtGewicht: 18000 },
            { id: "2", category: 18, label: "18+t", zulGesamtGewicht: 40000 },
          ]
        });
        var WeightOS = new ObjectStore({ objectStore: weightStore });
        var weightSelect = new Select({
          store: WeightOS,
          sortByLabel: false
        }, "weight");
        weightSelect.startup();
        weightSelect.focusFirstChild();
        weightSelect.on("change", function () {
          try {
            if (coordinates["start"]["coords"] == 0 || coordinates["stop"]["coords"] == 1) {

            } else {
              getRoute()
            }
          } catch (e) {
            console.log("cool");
          }
        })
        //dropdown for axles:
        var axlesStore = new Memory({
          data: [
            { id: 0, label: "2", category: 2 },
            { id: 1, label: "3", category: 3 },
            { id: 2, label: "4", category: 4 },
            { id: 3, label: "5+", category: 5 },
          ]
        });
        var axlesOS = new ObjectStore({ objectStore: axlesStore });
        var axlesSelect = new Select({
          store: axlesOS,
          sortByLabel: false
        }, "axle");
        axlesSelect.startup();
        axlesSelect.focusFirstChild()
        axlesSelect.on("change", function () {
          try {
            if (coordinates["start"]["coords"] == 0 || coordinates["stop"]["coords"] == 1) {

            } else {
              getRoute()
            }
          } catch (e) {
            console.log("cool");
          }
        })
        //polution openDropDown
        var polStore = new Memory({
          data: [
            { id: 0, label: "Euro 6", particulateFilter: 0, pollutantCategoryEuro: 6 },
            { id: 1, label: "EEV1", particulateFilter: 0, pollutantCategoryEuro: 15 },
            { id: 2, label: "Euro 5", particulateFilter: 0, pollutantCategoryEuro: 5 },
            { id: 3, label: "Euro 4", particulateFilter: 0, pollutantCategoryEuro: 4 },
            { id: 4, label: "Euro 3 + PMK 2", particulateFilter: 1, pollutantCategoryEuro: 3 },
            { id: 5, label: "Euro 3", particulateFilter: 0, pollutantCategoryEuro: 3 },
            { id: 6, label: "Euro 2 + PMK 1", particulateFilter: 1, pollutantCategoryEuro: 2 },
            { id: 7, label: "Euro 2", particulateFilter: 0, pollutantCategoryEuro: 2 },
            { id: 8, label: "Euro 1", particulateFilter: 0, pollutantCategoryEuro: 1 },
            { id: 9, label: "Euro 0", particulateFilter: 0, pollutantCategoryEuro: 0 },
          ]
        });
        var polOS = new ObjectStore({ objectStore: polStore });
        var polSelect = new Select({
          store: polOS,
          sortByLabel: false
        }, "pollution");
        polSelect.startup();
        polSelect.focusFirstChild()
        polSelect.on("change", function () {
          try {
            if (coordinates["start"]["coords"] == 0 || coordinates["stop"]["coords"] == 1) {

            } else {
              getRoute()
            }
          } catch (e) {
            console.log("cool");
          }

        })
        coordinates = {
          "start": { "addr": "", "magic": "", "coords": 0 },
          "stop": { "addr": "", "magic": "", "coords": 0 }
        }
        map = this.map;
        mautInfo = this.mautInfo;
        console.log(mautInfo);
        parser.parse();
        apiKey = this.config.apiKey;
        glS = new GraphicsLayer({ id: 'START' });
        glE = new GraphicsLayer({ id: 'END' });
        route = new GraphicsLayer({ id: 'ROUTE' });
        var infoTemplate = new InfoTemplate("Mautinformationen", "KOSTEN");
        route.setInfoTemplate(infoTemplate);
        this.map.addLayer(glS);
        this.map.addLayer(glE);
        this.map.addLayer(route);
        //container for addresses:
        startStore = new Memory({
          data: []
        });
        startBox = new ComboBox({
          id: "StartPoint",
          placeholder: "type an address",
          store: startStore,
          searchAttr: "name",
          onChange: function () {
            getAdd("StartPoint");
          },
          onKeyUp: function () {
            suggestAdd("StartPoint");
          },
        }, "StartPoint").startup();
        stopStore = new Memory({
          data: []
        });
        stopBox = new ComboBox({
          id: "StopPoint",
          placeholder: "type an address",
          store: stopStore,
          searchAttr: "name",
          onChange: function () {
            getAdd("StopPoint");
          },
          onKeyUp: function () {
            suggestAdd("StopPoint");
          },
        }, "StopPoint").startup();

        searchAdd = true;
        var suggestAdd = function (id) {

          queryText = registry.byId(id).get("value");
          //console.log(queryText);
          if (queryText.length < 5) {
            return;
          }
          if (searchAdd) {
            searchAdd = false;
            xhr('https://www.maut.toll-collect.de/arcgis/rest/services/' + endpoints["geocodingAddress"] + '/suggest', {
              query: {
                "f": "json",
                "text": queryText,
                "maxSuggestions": 5
              },
              headers: {
                "X-Requested-With": "" // server from rejecting the
              },
              handleAs: 'json'
            }).then(function (data) {
              try {

                if (id == 'StartPoint') {
                  startStore.data = []
                  for (e in data["suggestions"]) {
                    startStore.data.push({ "name": data["suggestions"][e]["text"], "value": data["suggestions"][e]["magicKey"] });
                  }


                } else {
                  stopStore.data = []
                  for (e in data["suggestions"]) {
                    stopStore.data.push({ "name": data["suggestions"][e]["text"], "value": data["suggestions"][e]["magicKey"] });
                  }
                  //registry.byId('StopPoint').set('value', data["suggestions"][0]["text"]);
                  //registry.byId('StopPoint').openDropDown();
                }
                searchAdd = true;
              } catch (e) {
                alert('no address for ' + dojo.byId(id).value + ' found!');
              }
            }, function (err) {
              alert('calling the API failed: <br>' + err);
            })
          }
        }

        var getAdd = function (id) {
          ref = registry.byId(id);
          ref.closeDropDown();
          queryText = ref.get("item")["name"];
          magic = ref.get("item")["value"];
          xhr('https://www.maut.toll-collect.de/arcgis/rest/services/' + endpoints["geocodingAddress"] + '/findAddressCandidates', {
            query: {
              "f": "json",
              "singleLine": queryText,
              "magicKey": magic,
              "outFields": "User_fld",
              "maxLocations": 1
            },
            headers: {
              "X-Requested-With": "" // server from rejecting the
            },
            handleAs: 'json'
          }).then(function (data) {

            try {
              if (id == 'StartPoint') {
                this.coordinates["start"] = { "addr": queryText, "magic": magic };
                addPoint([data["candidates"][0]["location"]["x"], data["candidates"][0]["location"]["y"]], "start");
              } else {
                this.coordinates["stop"] = { "addr": queryText, "magic": magic };
                addPoint([data["candidates"][0]["location"]["x"], data["candidates"][0]["location"]["y"]], "stop");
              }

            } catch (e) {
              alert('no point for ' + dojo.byId(id).value + ' found!');
            }
          }, function (err) {
            alert('calling the API failed: <br>' + err);
          })

        }

        var addPoint = function (coords, type) {
          this.map.getLayer('ROUTE').clear();
          var p = new Point(coords[0], coords[1]);
          if (type == 'start') {
            this.map.getLayer('START').clear();
            var s = new SimpleMarkerSymbol().setSize(10).setColor('green');
            var g = new Graphic(p, s);
            coordinates["start"]["coords"] = p;
            glS.add(g);
          } else {
            this.map.getLayer('END').clear();
            var s = new SimpleMarkerSymbol().setSize(10).setColor('red');
            var g = new Graphic(p, s);
            coordinates["stop"]["coords"] = p;
            glE.add(g);
          }
          button = registry.byId('RouteButton');
          if (this.coordinates["start"]["coords"] == 0 || this.coordinates["stop"]["coords"] == 1) {
            button.setDisabled(true);
          } else {
            button.setDisabled(false);
          }
        }


        startIn = registry.byId('StartPoint');

        // handle compressed geometry:
        function _fromCompressedGeometry( /*String*/ str, /*SpatialReference*/ sr) {
          var xDiffPrev = 0,
            yDiffPrev = 0,
            points = [],
            x, y,
            strings,
            coefficient;

          // Split the string into an array on the + and - characters
          strings = str.match(/((\+|\-)[^\+\-]+)/g);

          // The first value is the coefficient in base 32
          coefficient = parseInt(strings[0], 32);

          for (var j = 1; j < strings.length; j += 2) {
            // j is the offset for the x value
            // Convert the value from base 32 and add the previous x value
            x = (parseInt(strings[j], 32) + xDiffPrev);
            xDiffPrev = x;

            // j+1 is the offset for the y value
            // Convert the value from base 32 and add the previous y value
            y = (parseInt(strings[j + 1], 32) + yDiffPrev);
            yDiffPrev = y;

            points.push([x / coefficient, y / coefficient]);
          }

          return points;
        }
        var getRoute = function () {

          //dijit.registry.byId("standby").show();
          var currentdate = new Date();
          var datetime = currentdate.getFullYear() + "-"
            + (currentdate.getMonth() + 1) + "-"
            + currentdate.getDate() + "T"
            + (currentdate.getHours() + 1) + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds() + ".000+0000";
          //  dijit.registry.byId("pollution").getOptions(dijit.registry.byId("pollution").value)
          var weights = registry.byId("weight").getOptions(registry.byId("weight").value);
          var axles = registry.byId("axle").getOptions(registry.byId("axle").value);
          var poll = registry.byId("pollution").getOptions(registry.byId("pollution").value);
          dojo.xhrPost({
            url: "https://www.maut.toll-collect.de/services/booking/routings",
            postData: dojo.toJson({
              startDate: datetime,
              language: 'de',
              axles: axles.item.category,
              pollutantCategory: poll.label,
              particulateFilter: poll.item.particulateFilter,
              pollutantCategoryEuro: poll.item.pollutantCategoryEuro,
              weightCategoryId: weights.item.category,
              weightCategoryLabel: weights.label,
              axlesCategoryId: axles.item.category,
              axlesCategoryLabel: axles.label,
              height: 370,
              width: 255,
              totalWeight: weights.item.zulGesamtGewicht,
              hazardCategories: [],
              startPoint: {
                latitude: coordinates["start"]["coords"]["y"],
                longitude: coordinates["start"]["coords"]["x"],
                name: coordinates["start"]["addr"],
                type: 'Address'
              },
              endPoint: {
                latitude: coordinates["stop"]["coords"]["y"],
                longitude: coordinates["stop"]["coords"]["x"],
                name: coordinates["stop"]["addr"],
                type: "Address"
              },
              viaPoints: []
            }),
            headers: {
              'Host': ' www.maut.toll-collect.de',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:71.0) Gecko/20100101 Firefox/71.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*;q=0.8',
              'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
              'Accept-Encoding': 'gzip, deflate, br',
              'Content-Type': 'application/json',
              'Connection': 'keep-alive',
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache'
            },
            handleAs: 'json',
            load: function (data) {
              //console.log(data);
              map.getLayer('ROUTE').clear();
              var polylineT = new Polyline(); //type Toll
              var polylineO = new Polyline(); //type other
              //var polylineP = new Polyline();//type passt
              for (e in data["edges"]) {
                if (data["edges"][e]["edgeType"] == "toll" || data["edges"][e]["edgeType"] == "passThrough") {
                  polylineT.addPath(_fromCompressedGeometry(data["edges"][e]["compressedGeometry"]));
                }
                else {
                  polylineO.addPath(_fromCompressedGeometry(data["edges"][e]["compressedGeometry"]));
                }
              }
              var symbolT = new SimpleLineSymbol().setWidth(2).setColor('blue');
              var symbolO = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH).setWidth(2).setColor('blue');
              var polylineGraphicT = new Graphic(polylineT, symbolT);
              var polylineGraphicO = new Graphic(polylineO, symbolO);
              //  infoTemplate = null;
              infoText = "<b>Mautstart</b>: " +
                data["tollStartPoint"] + "<br><b>Mautendpunkt</b>: " +
                data["tollEndPoint"] + "<br><b>Mautdistanz</b>: " +
                data["tollDistance"] + "km<br><b>Mautkosten</b>: " +
                (data["charge"] / 100).toString() + "€<br><b>externe Kosten</b>: " +
                (data["externalCosts"] / 100).toString() + "€"
              infoTemplate.setContent(infoText);
              //add Mautinfo to Table
              //mautInfo.innerHTML = infoText;
              alert(infoText)
              route.setInfoTemplate(infoTemplate)
              route.add(polylineGraphicT);
              route.add(polylineGraphicO);
              var extent = graphicsUtils.graphicsExtent(route.graphics);
              map.setExtent(extent, true);
              route.show();
              //dijit.registry.byId("standby").hide();

            },
            error: function (error) {
              console.log(error);
            }
          })

        }
        myButton = new Button({
          label: 'Get Route!',
          disabled: true,
          onClick: function () {
            getRoute();
          }
        }, 'RouteButton').startup();

      },

      findRoute: function (coords) {
        this.inherited(arguments);
        console.log(coords);
      },

      geoCode: function (textbox) {
        this.inherited(arguments);

      },

      onOpen: function () {
        this.inherited(arguments);
        console.log('onOpen');

      },

      onClose: function () {
        console.log('onClose');
      },

      onMinimize: function () {
        console.log('onMinimize');
      },

      onMaximize: function () {
        console.log('onMaximize');
      },

      onSignIn: function (credential) {
        /* jshint unused:false*/
        console.log('onSignIn');
      },

      onSignOut: function () {
        console.log('onSignOut');
      },

      showVertexCount: function (count) {
        //this.vertexCount.innerHTML = 'The vertex count is: ' + count;
      }
    });
  });
