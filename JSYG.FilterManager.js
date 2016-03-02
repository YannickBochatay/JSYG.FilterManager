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
        
        _generateUid : function() {
          
            return (+new Date)+JSYG.rand(0,99999999);
        },
        
        setFilterElmt : function(selector) {
            
            var filterElmt = new JSYG(selector);
            var id = filterElmt.attr("id");
            
            if (!id) {
                id = "filter"+this._generateUid();
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
        
        _getFilters : function() {
            
            return this.getFilterElmt().children().not("feMerge,feBlend,feComposite,feImage,feTile");
        },
        
        add : function(type) {
                      
            var filter = new JSYG('<'+type+'>');
            
            var filters = this._getFilters();
            
            var lastFilter = filters.eq(-1);
            
            if (lastFilter.length) {
                
                filter.attr("in", lastFilter.attr("result") );
            }
            
            filter.attr("result", "blend"+this._generateUid());
            
            this.getFilterElmt().append(filter);
            
            //this._setBlend();
            
            return filter;
        },
        /*
        _setBlend : function() {
            
            var filterParent = this.getFilterElmt();
            
            var filters = this._getFilters();
            
            var blend = filterParent.find("feBlend");
            
            if (blend && filters.length < 2) blend.remove();
            else {
            
                if (!blend.length) blend = new JSYG("<feBlend>").attr("in","SourceGraphic").appendTo(filterParent);
            
                blend.attr("in2", filters.eq(-1).attr("result") );
            }
            
            return this;
        },
        */
        set : function(type,attrs,_exclude) {
            
            var filterParent = this.getFilterElmt();
            var filter, others;
            
            if (filterParent) {
                
                others = this._findOthers(_exclude);
                                
                if (others.length) {
                    this.clone();
                    this.set(type,attrs);
                    return this;
                }
            }
            else filterParent = this.create();
                
            filter = filterParent.find(type);
                
            if (!filter.length) filter = this.add(type);
            
            filter.attr(attrs);
            
            return this;
        },
                
        remove : function(type,_exclude) {
          
            var filterParent = this.getFilterElmt();
            var others;
                        
            others = this._findOthers(_exclude);
            
            if (!type) {
                
                if (others.length) new JSYG(this.node).css("filter","");
                else filterParent.remove();
            }
            else {
            
                if (others.length) {
                    this.clone();
                    this.remove(type);
                }
                else {
                    
                    filterParent.find(type).remove();
                    
                    //this._setBlend();
                    
                    if (!filterParent.children().length) {
                        new JSYG(this.node).css("filter","");
                        filterParent.remove();
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
        
        var opt = (stdDeviation == 0) ? null : { in:"SourceGraphic", stdDeviation:stdDeviation };
      
        return this.filterEffect("feGaussianBlur",opt);
    };
    
    JSYG.prototype.saturate = function(value) {
        
        var opt = (value == 1) ? null : { type:"saturate", values:value };
      
        return this.filterEffect("feColorMatrix",opt);
    };
    
    JSYG.prototype.hueRotate = function(value) {
        
        var opt = (value == 0) ? null : { type:"hueRotate", values:value };
      
        return this.filterEffect("feColorMatrix",opt);
    };
    
    return FilterManager;
});