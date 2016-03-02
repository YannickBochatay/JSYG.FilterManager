(function(root,factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-filtermanager",["jsyg"],factory);
    else if (typeof JSYG != "undefined") factory(JSYG);
    else throw new Error("JSYG is needed");
    
})(this,function(JSYG) {
            
    "use strict";
    
    function FilterManager(node) {
        
        if (node) this.node = new JSYG(node)[0];
    }
        
    FilterManager.prototype = {
                        
        getFilterElmt : function() {
            
            var urlFilter = JSYG(this.node).css("filter"),
            regUrl = /url\((['"]?)(#\w+)\1\)/,
            matches = urlFilter && regUrl.exec(urlFilter);
        
            if (!urlFilter || !matches) return null;
            
            return this.getRootElmt().find(matches[2]);
        },
        
        setFilterElmt : function(selector) {
            
            var filterElmt = new JSYG(selector);
            var id = filterElmt.attr("id");
            
            if (!id) {
                id = "filter"+(+new Date)+JSYG.rand(0,99999999);
                filterElmt.attr("id",id);
            }
          
            if (this.node) new JSYG(this.node).css("filter","url(#"+id+")");
            
            return this;
        },
        
        getRootElmt : function() {
            
            return new JSYG(this.node.nearestViewportElement);
        },
               
        create : function() {
            
            var root = this.getRootElmt(),
            defs = root.find('defs'),
            filterElmt = new JSYG("<filter>");

            if (!defs.length) defs = new JSYG('<defs>').prependTo(root);
            
            filterElmt.appendTo(defs);
            
            this.setFilterElmt(filterElmt);
            
            return filterElmt;
        },
        
        clone : function() {
          
            var oldFilter = this.getFilterElmt();
            
            var newFilter = this.create();
            
            oldFilter.children().each(function() {
                newFilter.append( new JSYG(this).clone() );
            });
            
            return newFilter;
        },
        
        set : function(type,attrs,_exclude) {
            
            var parent = this.getFilterElmt();
            var filter, others;
            
            if (parent) {
                
                others = this._findOthers(_exclude);
                                
                if (others.length) {
                    this.clone();
                    this.set(type,attrs);
                    return this;
                }
            }
            else parent = this.create();
                
            filter = parent.find(type);
                
            if (!filter.length) filter = new JSYG('<'+type+'>').appendTo(parent);
            
            filter.attr(attrs);
            
            return this;
        },
                
        remove : function(type,_exclude) {
          
            var parent = this.getFilterElmt();
            var others;
            
            if (!parent.length) return;
            
            others = this._findOthers(_exclude);
            
            if (!type) {
                
                if (others.length) new JSYG(this.node).css("filter","");
                else parent.remove();
            }
            else {
            
                if (others.length) {
                    this.clone();
                    this.remove(type);
                }
                else {
                    
                    parent.find(type).remove();
                    
                    if (!parent.children().length) {
                        new JSYG(this.node).css("filter","");
                        parent.remove();
                    }
                    
                }
                
            }
            
            return this;
        },
        
        _findOthers : function(exclude) {
            
            var root = this.getRootElmt(),
                filterElmt = this.getFilterElmt(),
                id = filterElmt.attr("id");
            
            return root.find("*[filter='url(#"+id+")']").not(exclude || this.node);
        }
    };
    
    JSYG.FilterManager = FilterManager;
        
    JSYG.prototype.filterEffect = function(type,attrs) {
        
        var name = "filterEffect";
        var collection = this;
        var commonFilter;
        
        JSYG.makeArray(this).some(function(item) {
            
            var filter = new JSYG(item).css("filter");
            var fm;
            
            if (!filter || filter == "none") {
                
                fm = new FilterManager(item);
                
                if (!commonFilter) commonFilter = fm.create();
                else fm.setFilterElmt(commonFilter);
            }
        });
                        
        return this.each(function(i) {
                
            var $this = new JSYG(this),
            filterManager = $this.data(name);

            if (!filterManager) {
                filterManager = new FilterManager(this);
                $this.data(name,filterManager);
            }
                                    
            if (attrs === null) filterManager.remove(type,collection);
            else if (type === null) filterManager.remove(null,collection);
            else filterManager.set(type,attrs,collection);

            return null;
        });
    };
    
    JSYG.prototype.gaussianBlur = function(stdDeviation) {
        
        var opt = (stdDeviation == 0) ? null : { in:"SourceGraphic", stdDeviation:stdDeviation || "0" };
      
        return this.filterEffect("feGaussianBlur",opt);
    };
    
    return FilterManager;
});