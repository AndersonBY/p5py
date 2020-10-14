;(function($B){

var bltns = $B.InjectBuiltins()
eval(bltns)

var object = _b_.object

var _window = self;

$B.pyobj2structuredclone = function(obj){
    // If the Python object supports the structured clone algorithm, return
    // the result, else raise an exception
    if(typeof obj == "boolean" || typeof obj == "number" ||
            typeof obj == "string"){
        return obj
    }else if(obj instanceof Number){
        return obj.valueOf()
    }else if(Array.isArray(obj) || obj.__class__ === _b_.list ||
            obj.__class__ === _b_.tuple){
        var res = []
        for(var i = 0, len = obj.length; i < len; i++){
            res.push($B.pyobj2structuredclone(obj[i]))
        }
        return res
    }else if(obj.__class__ === _b_.dict){
        if(Object.keys(obj.$numeric_dict).length > 0 ||
                Object.keys(obj.$object_dict).length > 0){
            throw _b_.TypeError.$factory("a dictionary with non-string " +
                "keys cannot be sent to or from a Web Worker")
        }
        var res = {}
        for(var key in obj.$string_dict){
            res[key] = $B.pyobj2structuredclone(obj.$string_dict[key])
        }
        return res
    }else{
        console.log(obj, obj.__class__)
        return obj
    }
}
$B.structuredclone2pyobj = function(obj){
    if(obj === null){
        return _b_.None
    }else if(typeof obj == "boolean" || typeof obj == "number" ||
            typeof obj == "string"){
        return obj
    }else if(obj instanceof Number){
        return obj.valueOf()
    }else if(Array.isArray(obj) || obj.__class__ === _b_.list ||
            obj.__class__ === _b_.tuple){
        var res = _b_.list.$factory()
        for(var i = 0, len = obj.length; i < len; i++){
            res.push($B.structuredclone2pyobj(obj[i]))
        }
        return res
    }else if(typeof obj == "object"){
        var res = _b_.dict.$factory()
        for(var key in obj){
            res.$string_dict[key] = $B.structuredclone2pyobj(obj[key])
        }
        return res
    }else{
        console.log(obj, Array.isArray(obj),
            obj.__class__, _b_.list, obj.__class__ === _b_.list)
        throw _b_.TypeError.$factory(_b_.str.$factory(obj) +
            " does not support the structured clone algorithm")
    }

}

// Transforms a Javascript constructor into a Python function
// that returns instances of the constructor, converted to Python objects

var JSConstructor = {
    __class__: _b_.type,
    __mro__: [object],
    $infos: {
        __module__: "<javascript>",
        __name__: 'JSConstructor'
    },
    $is_class: true
}

JSConstructor.__call__ = function(self){
    // self.func is a constructor
    // It takes Javascript arguments so we must convert
    // those passed to the Python function
    return function(){
        var args = [null]
        for(var i = 0, len = arguments.length; i < len; i++){
            args.push(pyobj2jsobj(arguments[i]))
        }
        var factory = self.func.bind.apply(self.func, args)
        var res = new factory()
        // res is a Javascript object
        return $B.$JS2Py(res)
    }
}

JSConstructor.__getattribute__ = function(self, attr){
    // Attributes of a constructor are taken from the original JS object
    if(attr == "__call__"){
        return function(){
            var args = [null]
            for(var i = 0, len = arguments.length; i < len; i++){
                args.push(pyobj2jsobj(arguments[i]))
            }
            var factory = self.func.bind.apply(self.func, args)
            var res = new factory()
            // res is a Javascript object
            return $B.$JS2Py(res)
        }
    }
    return JSObject.__getattribute__(self, attr)
}

JSConstructor.$factory = function(obj){
    return {
        __class__: JSConstructor,
        js: obj,
        func: obj.js_func
    }
}

// Object used to convert Javascript undefined value
var UndefinedClass = $B.make_class("undefined",
    function(){return Undefined}
)
UndefinedClass.__bool__ = function(){return false}
UndefinedClass.__repr__ = function(){return "undefined"}
var Undefined = {
    __class__: UndefinedClass
}

$B.set_func_names(UndefinedClass, "<javascript>")

var jsobj2pyobj = $B.jsobj2pyobj = function(jsobj) {
    switch(jsobj) {
      case true:
      case false:
        return jsobj
    }

    if(jsobj === undefined){return $B.Undefined}
    else if(jsobj === null){return _b_.None}

    if(Array.isArray(jsobj)){
        return _b_.list.$factory(jsobj.map(jsobj2pyobj))
    }

    if(typeof jsobj === 'number'){
       if(jsobj.toString().indexOf('.') == -1){return _b_.int.$factory(jsobj)}
       // for now, lets assume a float
       return _b_.float.$factory(jsobj)
    }

    if(jsobj.$nat === 'kw') {
        return jsobj
    }

    return JSObject.$factory(jsobj)
}

var pyobj2jsobj = $B.pyobj2jsobj = function(pyobj){
    // conversion of a Python object into a Javascript object
    if(pyobj === true || pyobj === false){return pyobj}
    if(pyobj === _b_.None){return null}
    if(pyobj === $B.Undefined){return undefined}

    var klass = $B.get_class(pyobj)
    if(klass === undefined){
        // not a Python object , consider arg as Javascript object instead
        return pyobj;
    }
    if(klass === JSObject || klass === JSConstructor){
        // Instances of JSObject and JSConstructor are transformed into the
        // underlying Javascript object

        // If the object is a function, the JSObject has a js_func attribute,
        // which is the original Javascript function
        if(pyobj.js_func !== undefined){return pyobj.js_func}
        return pyobj.js

    }else if(klass === $B.DOMNode ||
            klass.__mro__.indexOf($B.DOMNode) > -1){

        // instances of DOMNode or its subclasses are transformed into the
        // underlying DOM element
        return pyobj.elt

    }else if([_b_.list, _b_.tuple].indexOf(klass) > -1){

        // Python list : transform its elements
        var res = []
        pyobj.forEach(function(item){
            res.push(pyobj2jsobj(item))
        })
        return res

    }else if(klass === _b_.dict || _b_.issubclass(klass, _b_.dict)){

        // Python dictionaries are transformed into a Javascript object
        // whose attributes are the dictionary keys
        var jsobj = {}
        var items = _b_.list.$factory(_b_.dict.items(pyobj))
        items.forEach(function(item){
            if(typeof item[1] == 'function'){
                // set "this" to jsobj
                item[1].bind(jsobj)
            }
            jsobj[item[0]] = pyobj2jsobj(item[1])
        })
        return jsobj

    }else if(klass === _b_.float){

        // Python floats are converted to the underlying value
        return pyobj.valueOf()

    }else if(klass === $B.Function || klass === $B.method){
        // Transform arguments
        return function(){
            try{
                var args = []
                for(var i = 0; i < arguments.length; i++){
                    if(arguments[i] === undefined){args.push(_b_.None)}
                    else{args.push(jsobj2pyobj(arguments[i]))}
                }
                return pyobj2jsobj(pyobj.apply(this, args))
            }catch(err){
                console.log(err)
                console.log(_b_.getattr(err,'info'))
                console.log($B.class_name(err) + ':',
                    err.args.length > 0 ? err.args[0] : '' )
                throw err
            }
        }

    }else{
        // other types are left unchanged

        return pyobj

    }
}

// JSObject : wrapper around a native Javascript object

var JSObject = {
    __class__: _b_.type,
    __mro__: [object],
    $infos:{
        __module__: "builtins",
        __name__: 'JSObject'
    }
}

JSObject.__bool__ = function(self){
    return (new Boolean(self.js)).valueOf()
}

JSObject.__delattr__ = function(self, attr){
    _b_.getattr(self, attr) // raises AttributeError if necessary
    delete self.js[attr]
    return _b_.None
}

JSObject.__dir__ = function(self){
    return Object.keys(self.js)
}

JSObject.__getattribute__ = function(self,attr){
    var $test = false //attr == "data"
    if($test){console.log("get attr", attr, "of", self)}
    if(attr.substr(0,2) == '$$'){attr = attr.substr(2)}
    if(self.js === null){return object.__getattribute__(None, attr)}
    if(attr == "__class__"){return JSObject}
    if(attr == "__call__"){
        if(typeof self.js == "function"){
            return function(){
              // apply Javascript function to arguments converted from
              // Python objects to JS or DOM objects
              var args = []
              for(var i = 0; i < arguments.length; i++){
                  args.push($B.pyobj2jsobj(arguments[i]))
              }
              var res = self.js.apply(null, args)
              if(res === undefined){return None} // JSObject would throw an exception
              // transform JS / DOM result in Python object
              return JSObject.$factory(res)
            }
        }else{
            throw _b_.AttributeError.$factory("object is not callable")
        }
    }
    if(self.__class__ === JSObject && attr == "bind" &&
            self.js[attr] === undefined &&
            self.js['addEventListener'] !== undefined){
        // For JS objects, "bind" is aliased to addEventListener
        attr = 'addEventListener'
    }

    if(attr == "data" && self.js instanceof MessageEvent){
        return $B.structuredclone2pyobj(self.js.data)
    }
    var js_attr = self.js[attr]
    if(self.js_func && self.js_func[attr] !== undefined){
        js_attr = self.js_func[attr]
    }

    if(js_attr !== undefined){
        if($test){console.log("jsattr", js_attr)}
        if(typeof js_attr == 'function'){
            // If the attribute of a JSObject is a function F, it is converted to a function G
            // where the arguments passed to the Python function G are converted to Javascript
            // objects usable by the underlying function F
            var res = function(){
                var args = []
                for(var i = 0, len = arguments.length; i < len; i++){
                    var arg = arguments[i]
                    if(arg !== undefined && arg !== null &&
                            arg.$nat !== undefined){
                        var kw = arg.kw
                        if(Array.isArray(kw)){
                            kw = $B.extend(js_attr.name, ...kw)
                        }
                        if(Object.keys(kw).length > 0){
                            //
                            // Passing keyword arguments to a Javascript function
                            // raises a TypeError : since we don't know the
                            // signature of the function, the result of Brython
                            // code like foo(y=1, x=2) applied to a JS function
                            // defined by function foo(x, y) can't be determined.
                            //
                            throw _b_.TypeError.$factory(
                                "A Javascript function can't take " +
                                    "keyword arguments")
                        }
                    }else{
                        args.push(pyobj2jsobj(arg))
                    }
                }
                // IE workaround
                if(attr === 'replace' && self.js === location) {
                    location.replace(args[0])
                    return
                }
                // normally, we provide self.js as `this` to simulate js method call
                var new_this = self.js
                if(self.js_func){
                    // if self is a wrapped function, unwrap it back
                    new_this = self.js_func;
                }
                // but if we get explicit `this` (e.g. through apply call) we should pass it on
                if(this !== null && this !== undefined && this !== _window){
                    new_this = this
                }
                var result = js_attr.apply(new_this, args)
                return jsobj2pyobj(result)
            }
            res.__repr__ = function(){return '<function ' + attr + '>'}
            res.__str__ = function(){return '<function ' + attr + '>'}
            // this is very important for class-emulating functions
            res.prototype = js_attr.prototype
            return {__class__: JSObject, js: res, js_func: js_attr}
        }else{
            if($test){console.log("use JS2Py", $B.$JS2Py(js_attr))}
            return $B.$JS2Py(js_attr)
        }
    }else if(self.js === _window && attr === '$$location'){
        // special lookup because of Firefox bug
        // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
        return $Location()
    }

    var res = self.__class__[attr]
    if(res === undefined){
        // search in classes hierarchy, following method resolution order
        var mro = self.__class__.__mro__
        for(var i = 0, len = mro.length; i < len; i++){
            var v = mro[i][attr]
            if(v !== undefined){
                res = v
                break
            }
        }
    }
    if(res !== undefined){
        if($test){console.log("found in klass", res + "")}
        if(typeof res === 'function'){
            // res is the function in one of parent classes
            // return a function that takes self as first argument
            return function(){
                var args = [self]
                for(var i = 0, len = arguments.length; i < len; i++){
                    var arg = arguments[i]
                    if(arg && (arg.__class__ === JSObject ||
                            arg.__class__ === JSConstructor)){
                        args.push(arg.js)
                    }else{
                        args.push(arg)
                    }
                }
                return res.apply(self,args)
            }
        }
        return $B.$JS2Py(res)
    }else{
        // XXX search __getattr__
        throw _b_.AttributeError.$factory("no attribute " + attr + ' for ' +
            self.js)
    }
}

JSObject.__getitem__ = function(self, rank){
    if(typeof self.js.length == 'number'){
        if((typeof rank == "number" || typeof rank == "boolean") &&
                typeof self.js.item == 'function'){
            var rank_to_int = _b_.int.$factory(rank)
            if(rank_to_int < 0){rank_to_int += self.js.length}
            var res = self.js.item(rank_to_int)
            if(res === null){throw _b_.IndexError.$factory(rank)}
            return JSObject.$factory(res)
        }else if(typeof rank == "string" &&
                typeof self.js.getNamedItem == 'function'){
            var res = JSObject.$factory(self.js.getNamedItem(rank))
            if(res === undefined){throw _b_.KeyError.$factory(rank)}
            return res
        }
    }
    try{
        return $B.$call($B.$getattr(self.js, '__getitem__'))(rank)
    }catch(err){
        if(self.js[rank] !== undefined){
            return JSObject.$factory(self.js[rank])
        }
        throw _b_.KeyError.$factory(rank)
    }
}

var JSObject_iterator = $B.make_iterator_class('JS object iterator')
JSObject.__iter__ = function(self){
    var items = []
    if(_window.Symbol && self.js[Symbol.iterator] !== undefined){
        // Javascript objects that support the iterable protocol, such as Map
        // For the moment don't use "for(var item of self.js)" for
        // compatibility with uglifyjs
        // If object has length and item(), it's a collection : iterate on
        // its items
        var items = []
        if(self.js.next !== undefined){
            while(true){
                var nxt = self.js.next()
                if(nxt.done){
                    break
                }
                items.push(nxt.value)
            }
        }else if(self.js.length !== undefined && self.js.item !== undefined){
            for(var i = 0; i < self.js.length; i++){
                items.push(self.js.item(i))
            }
        }
        return JSObject_iterator.$factory(items)
    }else if(self.js.length !== undefined && self.js.item !== undefined){
        // collection
        for(var i = 0; i < self.js.length; i++){
            items.push(JSObject.$factory(self.js.item(i)))
        }
        return JSObject_iterator.$factory(items)
    }
    // Else iterate on the dictionary built from the JS object
    var _dict = JSObject.to_dict(self)
    return _b_.dict.__iter__(_dict)
}

JSObject.__le__ = function(self, other){
    if(typeof self.js["appendChild"] == "function"){
        return $B.DOMNode.__le__($B.DOMNode.$factory(self.js), other)
    }
    return _b_.NotImplemented
}
JSObject.__len__ = function(self){
    if(typeof self.js.length == 'number'){return self.js.length}
    try{return getattr(self.js, '__len__')()}
    catch(err){
        throw _b_.AttributeError.$factory(self.js + ' has no attribute __len__')
    }
}

JSObject.__repr__ = function(self){
    if(self.js instanceof Date){return self.js.toString()}
    var proto = Object.getPrototypeOf(self.js)
    if(proto){
        var name = proto.constructor.name
        if(name === undefined){ // IE
            var proto_str = proto.constructor.toString()
            name = proto_str.substring(8, proto_str.length - 1)
        }
        return "<" + name + " object>"
    }
    return "<JSObject wraps " + self.js + ">"
}

JSObject.__setattr__ = function(self, attr, value){
    if(attr.substr && attr.substr(0,2) == '$$'){
        // aliased attribute names, eg "message"
        attr = attr.substr(2)
    }
    if(isinstance(value, JSObject)){self.js[attr] = value.js}
    else{
        self.js[attr] = value
        if(typeof value == 'function'){
            self.js[attr] = function(){
                var args = []
                for(var i = 0, len = arguments.length; i < len; i++){
                    args.push($B.$JS2Py(arguments[i]))
                }
                try{return value.apply(null, args)}
                catch(err){
                    err = $B.exception(err)
                    var info = _b_.getattr(err, 'info')
                    if(err.args.length > 0){
                        err.toString = function(){
                            return info + '\n' + $B.class_name(err) +
                            ': ' + _b_.repr(err.args[0])
                        }
                    }else{
                        err.toString = function(){
                            return info + '\n' + $B.class_name(err)
                        }
                    }
                    console.log(err + '')
                    throw err
                }
            }
        }
    }
}

JSObject.__setitem__ = JSObject.__setattr__

JSObject.__str__ = JSObject.__repr__

var no_dict = {'string': true, 'function': true, 'number': true,
    'boolean': true}

JSObject.bind = function(self, evt, func){
    var js_func = function(ev) {
        return func(jsobj2pyobj(ev))
    }
    self.js.addEventListener(evt, js_func)
    return _b_.None
}

JSObject.to_dict = function(self){
    // Returns a Python dictionary based on the underlying Javascript object
    return $B.obj_dict(self.js, true)
}

JSObject.$factory = function(obj){
    if(obj === null){return _b_.None}
    // If obj is a function, calling it with JSObject implies that it is
    // a function defined in Javascript. It must be wrapped in a JSObject
    // so that when called, the arguments are transformed into JS values
    if(typeof obj == 'function'){
        return {__class__: JSObject, js: obj, js_func: obj}
    }

    var klass = $B.get_class(obj)
    // we need to do this or nan is returned, when doing json.loads(...)
    if(klass === _b_.float){return _b_.float.$factory(obj)}
    // Javascript array wrapper
    if(klass === _b_.list){
        return $B.JSArray.$factory(obj) // defined in py_list.js
    }

    // If obj is a Python object, return it unchanged
    if(klass !== undefined){return obj}
    return {
        __class__: JSObject,
        js: obj
    }
}

$B.JSObject = JSObject
$B.JSConstructor = JSConstructor




})(__BRYTHON__)

