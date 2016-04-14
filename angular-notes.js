/** STEP 1:  Create an angular app and instantiate it in the html with ng-app 	**/

	var app = angular.module('app',['ui.router']);     //   HTML ---->      <div ng-app="app">


/** STEP 2:	 Create a factory, which will likely be injected into your router and controller
			- Factories are never referenced in the html
			- Factories are run ONCE and return an object, which is then accessible by its injectees
			- Factories are where promises are made ($q)
			- Factories are where the api is used ($http)
			- Common functions will be fetchAll, fetchById, update, create, and delete
			- A helper function to quicky send the .data property of the api responses keeps things clean
			- File naming for factories is usually as follows:  widget.factory.js
**/

	app.factory('AppFactory', function($http, $q) {
		var parseData = function(res) {
			return res.data
		};

		return {
			fetchAll: function() {
				return $http.get('/api/widgets')
				.then(parseData);
			},
			update: function(id,widget) {
				return $http.put('/api/widgets/'+id, widget)
				.then(parseData);
			} 
		};
	});


/** STEP 3:	 Create a router, which is actually a 3rd-party directive, referenced in STEP 1 (ui.router)
			- Routers are made up of states, which are used to assign url's to specific page views and functionality
			- The view controlled by a router is instantiated in the html with the following element:  <ui-view></ui-view>
			- The only objects injected into routers are providers, such as $stateProvider and $urlRouterProvider
			- States can be nested; if they are, the child states automatically inherit the scope of their parents.
			- File naming for routers is usually as follows:  widget.states.js
**/

	app.config(function($stateProvider) {
		
		$stateProvider.state('widgets' {								/********  NON-PARAMETERIZED, NON-NESTED STATE *********/
			url: 			'/widgets',									
			templateUrl:	'/path/to/templates/widgets.html',			//	template code replaces ui-view's innerHTML when this state is active
			controller:		'WidgetsCtrl',								//	this avoids having to instantiate a controller in the template html
			
			resolve:		{											//	resolve is an map object, establishing a set of objects for injection into WidgetCtrl
																		//	as the name implies, resolve does not release these objects until their promises are resolved
				widgets:	function(WidgetFactory) {					//	Because the objects resolved are usually retrieved via the api, their functions require WidgetFactory
					return WidgetFactory.fetchAll();
				}
			}
	
		});

		$stateProvider.state('widget', {								/********  PARAMETERIZED, NON-NESTED STATE *********/
			url:			'/widget/:id',								//	When a state needs a specific item, we define a dynamic parameter by prepending it with a colon
			templateUrl:	'/path/to/templates/widget.html',
			controller:		'WidgetCtrl',
			resolve:		{
				widget:	function(WidgetFactory, $stateParams) {			//	$stateParams is injected into any resolve function that requires the state's dynamic parameter
					return WidgetFactory.fetchById($stateParams.id);
			}
		});

		$stateProvider.state('widget.similarWidget' {					/********  NON-PARAMETERIZED, NESTED STATE (note the dot) *********/
			url:			'/similarWidget',							//  a child's url string is APPENDED to its parent's (entire state path is /widget/:id/similarWidget)
			templateUrl:	'/path/to/templates/widget2.html',
			controller:		'Widget2Ctrl',
			resolve:		{
				widget2:	function(WidgetFactory, widget) {			//	because this state is nested within the widget state above, we can inject its resolved objects
					return WidgetFactory.fetchById(widget.similarId);	//	here we're assuming that every widget has a similarId field that refers to another widget in the db
			}
		});
	});


/** STEP 4:  Create a controller, 


