/** STEP 1:  Create an angular app and instantiate it in the html with ng-app 	
				- File naming for angular module instantiation is usually generic (app.js or index.js)
**/

	var app = angular.module('app',['ui.router']);     					//   HTML ---->      <body ng-app="app">


/** STEP 2:	 Create a factory, which will likely be injected into your router and controller
				- Factories are never referenced in the html
				- Factories are run ONCE and return an object, which is then accessible by its injectees
				- Factories are where promises are made ($q)   **** probably not covered
				- Factories are where the api is used ($http)
				- Common functions will be fetchAll, fetchById, update, create, and delete
				- File naming for factories is usually as follows:  widget.factory.js (one file per factory)
**/

	app.factory('AppFactory', function($http, $q) {
		var parseData = function(res) {									//	the parseData function is used to keep all api-related functions dry
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
				- The only objects injected into routers are providers, such as $stateProvider and $urlRouterProvider
				- States can be nested; if they are, the child states automatically inherit the scope of their parents.
				- File naming for routers is usually as follows:  widget.states.js (one file per router...NOT per state)
**/

	app.config(function($stateProvider) {								//   HTML ---->      <ui-view></ui-view>
		
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
			}
		});

		$stateProvider.state('widget.similarWidget', {					/********  NON-PARAMETERIZED, NESTED STATE (note the dot) *********/
			url:			'/similarWidget',							//  a child's url string is APPENDED to its parent's (entire state path is /widget/:id/similarWidget)
			templateUrl:	'/path/to/templates/widget2.html',
			controller:		'Widget2Ctrl',
			resolve:		{
				widget2:	function(WidgetFactory, widget) {			//	because this state is nested within the widget state above, we can inject its resolved objects
					return WidgetFactory.fetchById(widget.similarId);	//	here we're assuming that every widget has a similarId field that refers to another widget in the db
				}
			}
		});
	});

/** STEP 4:  Create a controller, which can either be added to an html element (ng-controller="WidgetsCtrl") 
			 or (MUCH more likely for the assessment) defined by a router module
				- Controllers are where DOM elements are managed ($scope, $rootScope)
				- Controllers are (usually) where routes/states are changed ($state)
				- Controllers are often injected with factories (ie. WidgetFactory)
				- Controllers are injected with any resolve objects "sent" by their respective states (ie. widgets, widget, widget2)
				- Controllers are meant to be thin
				- Since our GUI will need to query, add, remove, and update things; our controller will need to have functions for each, which in turn will
				  call the corresponding functions in the factory
				- File naming for controllers is usually as follows:  widgets.controller.js (one file per controller)
**/

	app.controller('WidgetsCtrl', function($scope, $state, WidgetFactory, widgets) {
		$scope.widgets = widgets;									// Objects injected via resolve are NOT on $scope by default!

		$scope.insert = function() {
			WidgetFactory.create($scope.newWidget)					//	Note that newWidget is grabbed from scope, which would be the case if we have an ng-form="newWidget"
			.then(function(widget) {									
				$state.go('widget',{id: widget._id})				//	Switching state to widget, with the id parameter (:id in the state's url), 
																	//  which is assigned to the newly-created widget's Mongo id (widget._id)
			
			});
		};

		$scope.remove = function(widget) {
			WidgetFactory.delete(widget) 
			.then(function(widget) {
				WidgetFactory.fetchAll()							//	Sometimes removal buttons are included in listings, so it's necessary to reload the list after
				.then(function(widgets) {
					$scope.widgets = widgets;
				});
			});
		};	
	});	
		
		
/** STEP 5:  Create a custom directive, which is normally added as either an html element or an html element's attribute
				- Like controllers, directives are often made to manage DOM elements
				- Directives are unique in that they do not have any dependencies injected at the highest level (ie. factories, $scope, etc)
				- Directives are often used as "black boxes":  each is meant to be ignorant of its parent's scope.  This allows for modularity and reusability.
				- When used in isolation, directives' inputs and data bindings are an intricate dance between the html attributes of the directive tag AND the
				  directive's isolate scope object.  (scope: {})
				- Directive can have their own controllers (similar to how routers can), but there is little reason to do so (link is your friend)
**/

	app.directive('myDirective', function() {							//  HTML ---->      <my-directive></my-directive>	
																		//	Directive names and attributes are kebob-case in HTML and camelCase in javascript
		return {
			restrict:  		'E',										//	E for element, A for attribute (default is AE)
			templateUrl:    '/path/to/templates/myDirective.html', 		//	template code is cached and used to replace the directive's innerHTML
			
			scope:  		{											
								/**	This is where we control just how isolated the directive's scope truly is.
										1.  Omitting this object (or writing scope: false) allows the directive to 
											read/write/create/modify anything in the parent's scope.  In other words, it
											doesn't even have its own scope.
										2.  Setting scope to true (scope: true) allows the directive READ ONLY access
											(or one-way) to its parent's scope, while being able to create/modify/read
											objects in its own scope.
										3.	Setting scope to an empty object (scope: {}) completely isolates the directive
											from its parent's scope (no read or write access).
										4.	Specifying exactly what values/bindings to offer the directive is shown below.
								**/

//											.............................................................										
//											. 															.																			
								directiveVariableX		:    '=',		//	HTML:  	<my-directive directive-variable-x		=		"widget" 
//								(on directive's scope)	    														         	(on parent's scope)	

								/** 
									An equals sign (=) establishes a two-bind (read/write) between an object on the parent's 
									scope (in this case widget) and an object on the directive's scope (in this case directiveVariableX).  
								**/

//											.............................................................										
//											. 															.																			
								directiveVariableY		: 	 '@',		//	HTML:         directive-variable-y				=		"1,2,{{1+2}}"      >
//								(on directive's scope)	    														         	  (rendered by DOM)	
								
								/** 
									An at symbol (@) assigns a directive scope variable (in this case directiveVariableY) a "hard coded" value that has
									first been rendered by the DOM (from parent's perspective/scope).  In this case, the rendered string will be "1,2,3"
									Since there is no direct link between this variable and any parent scope objects, it is isolated from the parent (no read or write)
								**/
			}, 

			link: 				function(scope, element, attrs)	{						//	These are order-dependent arguments, with scope representing the directive's
																						//	scope variables.  The lack of dollar sign is intentional.

								/**	
									A directive's link function essentially mimics a controller
								**/	
									scope.directiveVariableZ = scope.directiveVariableX.price;		//	assuming a widget has a price property
																									//	Now if our template html has {{directiveVariableZ}} anywhere,
																									//	it will be rendered by the DOM as the parent widget's price
																									//	(This example assumes <my-directive> within the widget state's template)

			}
		};
	});

