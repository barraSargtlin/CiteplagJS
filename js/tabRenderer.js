/**
 * responsible event handler and rendereding of comparison divs/texts
 * @author Paul Kujawa p.kujawa@gmx.net
 */
MyApp.TextAreas = (function() {
    TextAreas.patternPanels      = $('#patternPanels');
    TextAreas.comparisonDiv      = $('#comparison');
    TextAreas.errorDiv           = $('#errorOutput');
    TextAreas.detailsDiv         = $('aside');
    TextAreas.fileUpload         = $('#fileUpload');
    TextAreas.featToConnect      = {};


    /**
     *
     * @constructor
     */
    function TextAreas() {}



    /**
     * displays error message
     * @param content
     * @returns {boolean}
     */
    TextAreas.throwErrorMsg = function(content) {
        this.errorDiv
            .append('<span>' +content+ '</span>')
            .removeClass('hidden');
        return false;
    };



    /**
     * resets html markup
     */
    TextAreas.resetForNewFile = function() {
        this.patternPanels.empty();
        this.comparisonDiv.empty();
        this.errorDiv.empty().addClass('hidden');
        this.fileUpload.addClass('hidden');
        $('html, body').css('height', '100%');
        $('#help').removeClass('hidden');
        $('#pagedescription').remove();
        $('svg').remove();
    };



    /**
     * creates a tab for a matchType
     * @param patternTitle
     * @param leftFileHTML
     * @param rightFileHTML
     */
    TextAreas.createTab = function(patternTitle, leftFileHTML, rightFileHTML) {
        var tabPanel = $('<li class="navbar-brand"><a href="#'+patternTitle+'Tab" data-toggle="tab">'+patternTitle+'</a></li>');
        this.patternPanels.append(tabPanel);

        var tabPane = $('<div id="'+patternTitle+'Tab" class="tab-pane" data-matchtype="'+patternTitle+'"></div>')
            .append('<div class="leftArea">'+leftFileHTML+'</div>')
            .append('<div class="canvas"></div>')
            .append('<div class="rightArea">'+rightFileHTML+'</div>')
            .append('<div class="clearFloat"></div>');
        this.comparisonDiv.append(tabPane);
        MyApp.TextAreas.attachDetails(tabPane);
        MyApp.TextAreas.handleConnections(tabPane);
    };



    /**
     * attaches click listener to feature divs to display their details
     * @param tabPane
     */
    TextAreas.attachDetails = function(tabPane) {
        var _self = this;

        $(tabPane).find(".feature, .group, :not(.leftArea, .rightArea)").filter(function() { // no subfeats
            // get all groupX & featureX classes
            var featDiv         = this,
                detailString    = "",
                classList       = featDiv.classList.toString(),
                groupClasses    = classList.match(/group(\d+)/g),
                featClasses     = classList.match(/feature(\d+)/g);

            if (groupClasses != null)   detailString = MyApp.TextAreas.getDetail(groupClasses, detailString);
            if (featClasses  != null)   detailString = MyApp.TextAreas.getDetail(featClasses, detailString);

            $(featDiv).click(function() {
                _self.detailsDiv.empty();
                _self.detailsDiv.append(detailString);
            }).css('cursor', 'pointer');
        });
    };



    /**
     * Get match detail for given class
     * @param classList
     * @param details
     * @returns {*}
     */
    TextAreas.getDetail = function(classList, details) {
        $.each(classList, function(i, classi) {
            if (MyApp.FindingsParser.featDetails.hasOwnProperty(classi))
                details += '<h3>Match detail ' +classi+ '</h3>' + MyApp.FindingsParser.featDetails[classi];
        });
        return details;
    };



    /**
     * Makes feature tags highlighted after clicks & scroll to them
     * @param tabPane
     */
    TextAreas.handleConnections = function(tabPane) {
        $(tabPane).find(".leftArea .feature, .rightArea .feature").filter(function() {
            var featDiv     = this,
                classList   = featDiv.classList.toString();

            // make all featureX & featureX_Y animated
            var subFeatClasses  = classList.match(/feature(\d+)_(\d+)/g),
                featClasses     = classList.match(/feature(\d+)$/g);

            // combine all classes
            if (subFeatClasses != null && featClasses != null)
                $.merge(subFeatClasses, featClasses);
            else if (subFeatClasses == null && featClasses != null)
                subFeatClasses = featClasses;

            if (subFeatClasses != null) {
                var connections,
                    matchType = $(tabPane).data("matchtype");
                if ($(featDiv).parents('.leftArea').length > 0)
                        connections = MyApp.TextAreas.getConnections(subFeatClasses, matchType, 'l');
                else    connections = MyApp.TextAreas.getConnections(subFeatClasses, matchType, 'r');

                $(featDiv).click(function() {
                    MyApp.TextAreas.highlightConnection(connections)
                }).css( 'cursor', 'pointer' );
            }
        });
    };



    /**
     * Returns array with connected classList
     * @param classList
     * @param side
     * @param matchType
     * @returns {*}
     */
    TextAreas.getConnections = function(classList, matchType, side) {
        var _self       = this,
            connections = [];

        // featToConnect[machType][leftClass] = rightClass
        if (side === 'l') {
            $.each(classList, function(i, leftClass) {
                if ( _self.featToConnect[matchType].hasOwnProperty(leftClass)) {
                    $.each(_self.featToConnect[matchType][leftClass], function(i, rightClass) {
                        var connection = {leftClass: leftClass, rightClass: rightClass};
                        connections.push(connection);
                    });
                }
            });

        } else if (side === 'r') {
            $.each(classList, function(i, rightClass) {
                $.each(_self.featToConnect[matchType], function(leftClass, rightClasses) {
                    $.each(rightClasses, function(i, classi) {
                       if (classi == rightClass) {
                           var connection = {leftClass: leftClass, rightClass: rightClass};
                           connections.push(connection);
                       }
                    });
                });
            });
        }

        return connections;
    };


    /**
     * Gets all connected classes of one feat-tag to highlight them and scroll them serially into view
     * @param connections
     */
    TextAreas.highlightConnection = function(connections) {
        var _self       = this,
            tab         = this.comparisonDiv.find('.tab-pane.active'),
            allDivs     = tab.find('.leftArea *, .rightArea *');

        allDivs.removeClass('alert alert-info'); // incl. feat highlighted for match details

        $.each(connections, function(i, connection) {
            var leftClass    = '.leftArea  .'+connection['leftClass'],
                rightClass   = '.rightArea .'+connection['rightClass'];

            tab.find(leftClass+','+rightClass).addClass('alert alert-info');
            MyApp.TextAreas.scrollToFeature( tab.find(leftClass).first() );
            MyApp.TextAreas.scrollToFeature( tab.find(rightClass).first() );
        });

        allDivs.one("mouseup", function() {
            allDivs.removeClass('alert alert-info'); // incl. feat highlighted for match details
            _self.detailsDiv.empty();
        });
    };



    /**
     * Scrolls one side to feature-div
     * @param feature
     */
    TextAreas.scrollToFeature = function(feature) {
        var lineHeight  = parseFloat(feature.css('line-height')),
            area        = feature.closest('.leftArea, .rightArea'),
            relFeatPos  = feature.offset().top - area.offset().top + area.scrollTop(); // height within text flow

        if (relFeatPos >= lineHeight)
            relFeatPos -= lineHeight; // to show previous line as well for context

        area.animate({scrollTop: relFeatPos}, 1500);
    };


    return TextAreas;
})();
