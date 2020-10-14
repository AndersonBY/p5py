// Script with function to load scripts and modules, including indexedDB cache

(function($B){

var _b_ = $B.builtins

if($B.VFS_timestamp && $B.VFS_timestamp > $B.timestamp){
    // A VFS created by python -m brython --modules has its own
    // timestamp. If it is after the one in brython.js, use it
    $B.timestamp = $B.VFS_timestamp
}

function idb_load(evt, module){
    // Callback function of a request to the indexedDB database with a module
    // name as key.
    // If the module is precompiled and its timestamp is the same as in
    // brython_stdlib, use the precompiled Javascript.
    // Otherwise, get the source code from brython_stdlib.js.

    var res = evt.target.result

    var timestamp = $B.timestamp

    if(res === undefined || res.timestamp != $B.timestamp){
        // Not found or not with the same date as in brython_stdlib.js:
        // search in VFS
        if($B.VFS[module] !== undefined){
            var elts = $B.VFS[module],
                ext = elts[0],
                source = elts[1]
            if(ext == ".py"){
                var imports = elts[2],
                    is_package = elts.length == 4,
                    source_ts = elts.timestamp,
                    __package__

                // Temporarily set $B.imported[module] for relative imports
                if(is_package){__package__ = module}
                else{
                    var parts = module.split(".")
                    parts.pop()
                    __package__ = parts.join(".")
                }
                $B.imported[module] = $B.module.$factory(module, "",
                    __package__)
                try{
                    var root = $B.py2js(source, module, module),
                        js = root.to_js()
                }catch(err){
                    $B.handle_error(err)
                    throw err
                }
                // Delete temporary import
                delete $B.imported[module]
                if($B.debug > 1){console.log("precompile", module)}

                // Store Javascript translation in indexedDB
                var parts = module.split(".")
                if(parts.length > 1){parts.pop()}
                if($B.stdlib.hasOwnProperty(parts.join("."))){
                    var imports = elts[2]
                    imports = imports.join(",")
                    $B.tasks.splice(0, 0, [store_precompiled,
                        module, js, source_ts, imports, is_package])
                }
            }else{
                console.log('bizarre', module, ext)
            }
        }else{
            // Module not found : do nothing
        }
    }else{
        // Precompiled Javascript found in indexedDB database.
        if(res.is_package){
            $B.precompiled[module] = [res.content]
        }else{
            $B.precompiled[module] = res.content
        }
        if(res.imports.length > 0){
            // res.imports is a string with the modules imported by the current
            // modules, separated by commas
            if($B.debug > 1){
                console.log(module, "imports", res.imports)
            }
            var subimports = res.imports.split(",")
            for(var i = 0; i < subimports.length; i++){
                var subimport = subimports[i]
                if(subimport.startsWith(".")){
                    // Relative imports
                    var url_elts = module.split("."),
                        nb_dots = 0
                    while(subimport.startsWith(".")){
                        nb_dots++
                        subimport = subimport.substr(1)
                    }
                    var elts = url_elts.slice(0, nb_dots)
                    if(subimport){
                        elts = elts.concat([subimport])
                    }
                    subimport = elts.join(".")
                }
                if(!$B.imported.hasOwnProperty(subimport) &&
                        !$B.precompiled.hasOwnProperty(subimport)){
                    // If the code of the required module is not already
                    // loaded, add a task for this.
                    if($B.VFS.hasOwnProperty(subimport)){
                        var submodule = $B.VFS[subimport],
                            ext = submodule[0],
                            source = submodule[1]
                        if(submodule[0] == ".py"){
                            $B.tasks.splice(0, 0, [idb_get, subimport])
                        }else{
                            add_jsmodule(subimport, source)
                        }
                    }
                }
            }
        }
    }
    loop()
}

function store_precompiled(module, js, source_ts, imports, is_package){
    // Sends a request to store the compiled Javascript for a module.
    var db = $B.idb_cx.result,
        tx = db.transaction("modules", "readwrite"),
        store = tx.objectStore("modules"),
        cursor = store.openCursor(),
        data = {"name": module,
            "content": js,
            "imports": imports,
            "origin": origin,
            "timestamp": __BRYTHON__.timestamp,
            "source_ts": source_ts,
            "is_package": is_package
            },
        request = store.put(data)
        if($B.debug > 1){
            console.log("store precompiled", module, "package", is_package)
        }
    request.onsuccess = function(evt){
        // Restart the task "idb_get", knowing that this time it will use
        // the compiled version.
        $B.tasks.splice(0, 0, [idb_get, module])
        loop()
    }
}


function idb_get(module){
    // Sends a request to the indexedDB database for the module name.
    var db = $B.idb_cx.result,
        tx = db.transaction("modules", "readonly")

    try{
        var store = tx.objectStore("modules")
            req = store.get(module)
        req.onsuccess = function(evt){idb_load(evt, module)}
    }catch(err){
        console.info('error', err)
    }
}

function remove_from_cache(cursor, record){
    var request = cursor.delete()
    request.onsuccess = function(){
        if($B.debug > 1){
            console.log("delete outdated", record.name)
        }
    }
}

$B.idb_open = function(obj){
    $B.idb_name = "brython-cache"
    var idb_cx = $B.idb_cx = indexedDB.open($B.idb_name)
    idb_cx.onsuccess = function(){
        var db = idb_cx.result
        if(!db.objectStoreNames.contains("modules")){
            var version = db.version
            db.close()
            console.info('create object store', version)
            idb_cx = indexedDB.open($B.idb_name, version+1)
            idb_cx.onupgradeneeded = function(){
                console.info("upgrade needed")
                var db = $B.idb_cx.result,
                    store = db.createObjectStore("modules", {"keyPath": "name"})
                store.onsuccess = loop
            }
            idb_cx.onversionchanged = function(){
                console.log("version changed")
            }
            idb_cx.onsuccess = function(){
                console.info("db opened", idb_cx)
                var db = idb_cx.result,
                    store = db.createObjectStore("modules", {"keyPath": "name"})
                store.onsuccess = loop
            }
        }else{
            console.info("using indexedDB for stdlib modules cache")
            // Preload all compiled modules

            var tx = db.transaction("modules", "readwrite"),
                store = tx.objectStore("modules"),
                record,
                outdated = []

            store.openCursor().onsuccess = function(evt){
                cursor = evt.target.result
                if(cursor){
                    record = cursor.value
                    // A record is valid if the Brython engine timestamp is
                    // the same as record.timestamp, and the timestamp of the
                    // VFS file where the file stands is the same as
                    // record.source_ts
                    if(record.timestamp == $B.timestamp){
                        if(!$B.VFS || !$B.VFS[record.name] ||
                                $B.VFS[record.name].timestamp == record.source_ts){
                            // Load in __BRYTHON__.precompiled
                            if(record.is_package){
                                $B.precompiled[record.name] = [record.content]
                            }else{
                                $B.precompiled[record.name] = record.content
                            }
                            if($B.debug > 1){
                                console.log("load from cache", record.name)
                            }
                        }else{
                            // If module with name record.name exists in a VFS
                            // and its timestamp is not the VFS timestamp,
                            // remove from cache
                            remove_from_cache(cursor, record)
                        }
                    }else{
                        remove_from_cache(cursor, record)
                    }
                    cursor.continue()
                }else{
                    if($B.debug > 1){
                        console.log("done")
                    }
                    loop()
                }
            }
        }
    }
    idb_cx.onupgradeneeded = function(){
        console.info("upgrade needed")
        var db = idb_cx.result,
            store = db.createObjectStore("modules", {"keyPath": "name"})
        store.onsuccess = loop
    }
    idb_cx.onerror = function(){
        console.info('could not open indexedDB database')
    }
}

$B.ajax_load_script = function(script){
    var url = script.url,
        name = script.name
    if($B.files && $B.files.hasOwnProperty(name)){
        $B.tasks.splice(0, 0, [$B.run_script, $B.files[name],
            name, true])
        loop()
    }else if($B.protocol != "file"){
        var req = new XMLHttpRequest()
        req.open("GET", url + "?" + Date.now(), true)
        req.onreadystatechange = function(){
            if(this.readyState == 4){
                if(this.status == 200){
                    var src = this.responseText
                    if(script.is_ww){
                        $B.webworkers[name] = src
                    }else{
                        $B.tasks.splice(0, 0, [$B.run_script, src, name, true])
                    }
                }else if(this.status == 404){
                    throw Error(url + " not found")
                }
                loop()
            }
        }
        req.send()
    }
}

function add_jsmodule(module, source){
    // Use built-in Javascript module
    source += "\nvar $locals_" +
        module.replace(/\./g, "_") + " = $module"
    $B.precompiled[module] = source
}

var inImported = $B.inImported = function(module){
    if($B.imported.hasOwnProperty(module)){
        // already imported, do nothing
    }else if(__BRYTHON__.VFS && __BRYTHON__.VFS.hasOwnProperty(module)){
        var elts = __BRYTHON__.VFS[module]
        if(elts === undefined){console.log('bizarre', module)}
        var ext = elts[0],
            source = elts[1],
            is_package = elts.length == 4
        if(ext==".py"){
            if($B.idb_cx){
                $B.tasks.splice(0, 0, [idb_get, module])
            }
        }else{
            add_jsmodule(module, source)
        }
    }else{
        console.log("bizarre", module)
    }
    loop()
}

var loop = $B.loop = function(){
    if($B.tasks.length == 0){
        // No more task to process.
        if($B.idb_cx){
            $B.idb_cx.result.close()
            $B.idb_cx.$closed = true
        }
        return
    }
    var task = $B.tasks.shift(),
        func = task[0],
        args = task.slice(1)

    if(func == "execute"){
        try{
            var script = task[1],
                script_id = script.__name__.replace(/\./g, "_"),
                module = $B.module.$factory(script.__name__)

            module.$src = script.$src
            module.__file__ = script.__file__
            $B.imported[script_id] = module

            new Function("$locals_" + script_id, script.js)(module)

        }catch(err){
            // If the error was not caught by the Python runtime, build an
            // instance of a Python exception
            if(err.$py_error === undefined){
                console.log('Javascript error', err)
                if($B.is_recursion_error(err)){
                    err = _b_.RecursionError.$factory("too much recursion")
                }else{
                    $B.print_stack()
                    err = _b_.RuntimeError.$factory(err + '')
                }
            }
            if($B.debug > 1){
                console.log("handle error", err.__class__, err.args)
            }
            $B.handle_error(err)
        }
        loop()
    }else{
        // Run function with arguments
        func.apply(null, args)
    }
}

$B.tasks = []
$B.has_indexedDB = self.indexedDB !== undefined

$B.handle_error = function(err){
    // Print the error traceback on the standard error stream
    if(err.__class__ !== undefined){
        var name = $B.class_name(err),
            trace = _b_.getattr(err, 'info')
        if(name == 'SyntaxError' || name == 'IndentationError'){
            var offset = err.args[3]
            trace += '\n    ' + ' '.repeat(offset) + '^' +
                '\n' + name + ': '+err.args[0]
        }else{
            trace += '\n' + name + ': ' + err.args
        }
    }else{
        console.log(err)
        trace = err + ""
    }
    try{
        _b_.getattr($B.stderr, 'write')(trace)
    }catch(print_exc_err){
        console.log(trace)
    }
    // Throw the error to stop execution
    throw err
}

function required_stdlib_imports(imports, start){
    // Returns the list of modules from the standard library needed by
    // the modules in "imports"
    var nb_added = 0
    start = start || 0
    for(var i = start; i < imports.length; i++){
        var module = imports[i]
        if($B.imported.hasOwnProperty(module)){continue}
        var mod_obj = $B.VFS[module]
        if(mod_obj === undefined){console.log("undef", module)}
        if(mod_obj[0] == ".py"){
            var subimports = mod_obj[2] // list of modules needed by this mod
            subimports.forEach(function(subimport){
                if(!$B.imported.hasOwnProperty(subimport) &&
                        imports.indexOf(subimport) == -1){
                    if($B.VFS.hasOwnProperty(subimport)){
                        imports.push(subimport)
                        nb_added++
                    }
                }
            })
        }
    }
    if(nb_added){
        required_stdlib_imports(imports, imports.length - nb_added)
    }
    return imports
}

})(__BRYTHON__)
