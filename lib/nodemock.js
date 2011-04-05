/**

	The MIT License
	
	Copyright (c) 2011 Arunoda Susiripala
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

 */


function NodeMock(methodName) {
	
	var currentMockFunction = null;
	var shouldFail = [];
	
	var entries = {};
	
	var mockFunction = function(method) {
		
		function getValidEntry(args) {
			
			for(var index in entries[method]) {
				entry = entries[method][index];
				if(deepObjectCheck(entry.args, args)) {
					entry.executed ++;
					return entry;
				}
				//increasing executed numbers for that entry
			}
			return false;
		}
		
		return function() {
			//check for argument length
			var entry;
			
			if(shouldFail[method]) {
				throw new Error("You should not call anymethod on this object");
				
			} else if(!this[method]) {
				throw new Error("Mock function '" + method + "()' is not defined");
				
			} else if(!(entry =  getValidEntry(arguments))) {
				//check for argument content
				throw new Error("Arguments content passed is not tally with expected");
			}
			
			//calling the callback
			if(entry.callbackIndex) {
				var func = arguments[entry.callbackIndex];
				if(typeof(func) == "function") {
					func.apply(this, entry.callbackArgs || []);
				} else {
					throw new Error("Expected callback is not defined as callback");
				}
			}
			
			return entry.returns;
		};
	};
	
	this.takes = function() {
		var entry = entries[currentMockFunction][entries[currentMockFunction].length - 1];
		entry.args = arguments;
		return this;
	};
	
	this.times = function(expected) {
		var entry = entries[currentMockFunction][entries[currentMockFunction].length - 1];
		entry.expectedExecutions = expected;
		return this;
	};
	
	this.returns = function(value) {
		var entry = entries[currentMockFunction][entries[currentMockFunction].length - 1];
		entry.returns = value;
		return this;
	};
	
	this.calls = function() {
		
		if(typeof(arguments[0]) == "number") {
			var entry = entries[currentMockFunction][entries[currentMockFunction].length - 1];
			
			entry.callbackIndex = arguments[0];
			if(arguments[1] && (arguments[1] instanceof Array)) {
				entry.callbackArgs = arguments[1];
			}
			
			return this;
		} else {
			throw new Error("First arg of the calls() should be the index of the callback");
		}
	};
	
	this.assert = function() {
		
		var success = true;
		for(var method in entries) {
			var entriesForMethod = entries[method];
			entriesForMethod.forEach(function(entry) {
				if(entry.executed != entry.expectedExecutions) {
					success = false;
					console.error(
							"method call for: '" + method + "()' with params: " + getParamString(entry.args) + " executed " +
							entry.executed + " times. (but excepted " + entry.expectedExecutions + " times)");
				}
			});
		}
		
		return success;
	};
	
	//Assign the mocking function
	this.mock = function(method) {
		
		//let the current mocking method be this
		currentMockFunction = method;
		
		if(!this[method]) {
			
			entries[currentMockFunction] = [];
			//assign the mock method
			this[method] = mockFunction(method);
		}
		
		entries[currentMockFunction].push({
			args: [],
			callbackIndex: null,
			callbackParams: null,
			returns: undefined,
			executed: 0,
			expectedExecutions: 1
		});
		
		return this;
	};
	
	/**
	 * After this call when someone calls on this this object is'll
	 * throw an exception
	 */
	this.fail = function() {
		shouldFail[currentMockFunction] = true;
		return this;
	};
	
	function deepObjectCheck(expected, actual) {
		
		if(expected.length != actual.length) return false;
		
		for(var key in expected) {
			
			var actualType = typeof(actual[key]);
			var expectedType = typeof(expected[key]);
			
			if(actualType != expectedType) return false;
			if(actualType == "function") {
				continue;
			} else if(actualType == "object") {
				if(!deepObjectCheck(actual[key], expected[key])) return false;
			} else {
				if(actual[key] != expected[key]) return false;
			}
		}
		
		return true;
	};
	
	function getParamString(params) {
		
		var paramString = "(";
		for(var index in params) {
			var param = params[index];
			if(param instanceof Function) {
				paramString += "function() {}, ";
			} else if(param instanceof RegExp) {
				paramString += param.toString() + ", ";
			} else {
				paramString += JSON.stringify(param) + ", ";
			}
		}
		
		paramString = paramString.substring(0, paramString.length -2) + ")";
		return paramString;
	};
	
	
	//initialize the mocking
	this.mock(methodName);
	
}

//Supporting NodeJS CommonJS module system
if(typeof(exports) != "undefined") {
	exports.mock = function(methodName) {
		return new NodeMock(methodName);
	};
	
	exports.fail = function() {
		return {};
	};
}