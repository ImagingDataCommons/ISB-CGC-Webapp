
require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.5.1',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        jquerydt: 'libs/jquery.dataTables.min',
        //d3: 'libs/d3.v5.min',
        base: 'base',
        underscore: 'libs/underscore-min'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'jquerydt': ['jquery']
    }
});


require([
    'jquery',
    'underscore',
    'jquerydt',
    'jqueryui',
    'bootstrap',
    'base'
], function($, _, jqueryui, bootstrap, jquerydt ) {

    $('.manifest-size-warning').hide();

    window.filterObj = {};
    window.projIdSel = [];
    window.studyIdSel = [];
    //window.tcgaColls = ["tcga_blca", "tcga_brca", "tcga_cesc", "tcga_coad", "tcga_esca", "tcga_gbm", "tcga_hnsc", "tcga_kich", "tcga_kirc", "tcga_kirp", "tcga_lgg", "tcga_lihc", "tcga_luad", "tcga_lusc", "tcga_ov", "tcga_prad", "tcga_read", "tcga_sarc", "tcga_stad", "tcga_thca", "tcga_ucec"];
    window.projSets = new Object();
    window.projSets['tcga']=["tcga_blca", "tcga_brca", "tcga_cesc", "tcga_coad", "tcga_esca", "tcga_gbm", "tcga_hnsc", "tcga_kich", "tcga_kirc", "tcga_kirp", "tcga_lgg", "tcga_lihc", "tcga_luad", "tcga_lusc", "tcga_ov", "tcga_prad", "tcga_read", "tcga_sarc", "tcga_stad", "tcga_thca", "tcga_ucec"];
    window.projSets['rider']=["rider_lung_ct", "rider_phantom_pet_ct","rider_breast_mri", "rider_neuro_mri","rider_phantom_mri", "rider_lung_pet_ct"];
    window.projSets['qin'] = ["qin_headneck","qin_lung_ct","qin_pet_phantom","qin_breast_dce_mri"];

    var plotLayout = {
        title: '',
        autosize: true,
        margin: {
            l: 30,
            r: 30,
            b: 60,
            t: 30,
            pad: 0
        },
        xaxis: {type: 'category', dtick: 1}
    };

    var pieLayout = {
        title: '',
        autosize: true,
        margin: {
            l: 30,
            r: 30,
            b: 60,
            t: 30,
            pad: 0
        },
        showlegend: false,
        legend: {
            x: 2,
            y: 0,
            traceorder: 'normal',
            font: {
                family: 'sans-serif',
                size: 4,
                color: '#000'
            },
            bgcolor: '#E2E2E2',
            bordercolor: '#FFFFFF',
            borderwidth: 2
        }
    };

    window.hidePanel=function(){
        $('#lh_panel').hide();
         $('#show_lh').show();
         $('#show_lh').removeClass('hidden');
        $('#rh_panel').removeClass('col-lg-9');
        $('#rh_panel').removeClass('col-md-9');
        $('#rh_panel').addClass('col-lg-12');
        $('#rh_panel').addClass('col-md-12');
    };

    window.showPanel=function(){
        $('#lh_panel').show();
        $('#show_lh').hide();
        $('#rh_panel').removeClass('col-lg-12');
        $('#rh_panel').removeClass('col-md-12');
        $('#rh_panel').addClass('col-lg-9');
        $('#rh_panel').addClass('col-md-9');
    };

    window.setSlider = function (slideDiv, reset, strt, end, isInt, updateNow) {
        parStr=$('#'+slideDiv).data("attr-par");
        var max = $('#' + slideDiv).slider("option", "max");
        var divName = slideDiv.replace("_slide","");
        if (reset) {
            strt = $('#' + slideDiv).parent().attr('data-min');
            end = $('#' + slideDiv).parent().attr('data-max');
            $('#' + slideDiv).parent().removeClass('isActive');
        }
        else{
            $('#' + slideDiv).parent().addClass('isActive');
        }
        $('#' + slideDiv).parent().attr('data-curminrng',strt);
        $('#' + slideDiv).parent().attr('data-curmaxrng',end);
        vals = [strt, end];
        $('#' + slideDiv).find(".slide_tooltip").each(function(index){
            $(this).text(vals[index].toString());
        });

        $('#' + slideDiv).slider("values", "0", strt);
        $('#' + slideDiv).slider("values", "1", end);
        var inpDiv = slideDiv.replace("_slide", "_input");
        var val = String(strt) + "-" + String(end);

        document.getElementById(inpDiv).value = val;
        nm=new Array();
        var filterCats= $('#'+divName).parentsUntil('.tab-pane','.list-group-item__body');
        for (var i=0;i<filterCats.length;i++){
            var ind = filterCats.length-1-i;
            nm.push(filterCats[ind].id);
        }
        nm.push(divName);
        filtAtt = nm.join('.')+ '_rng';
        if (reset) {
            if (  (window.filterObj.hasOwnProperty(filtAtt)) && (window.filterObj[filtAtt].hasOwnProperty('rng')) ) {
                delete window.filterObj[filtAtt]['rng'];
                if ( 'none' in window.filterObj[filtAtt]){
                    window.filterObj[filtAtt]['type']='none';
                }
                else{
                    delete window.filterObj[filtAtt];
                }
            }
        }
        else {
            var attVal = [];
            if (isInt) {
                attVal = [parseInt(strt), parseInt(end)];
            }
            else {
                attVal = [parseFloat(strt), parseFloat(end)];
                }

            if (!(filtAtt in window.filterObj)){
                window.filterObj[filtAtt] = new Object();
            }
            window.filterObj[filtAtt]['rng'] = attVal;
            if (end<max) {
                window.filterObj[filtAtt]['type'] = 'ebtw';
            }
            else{
                window.filterObj[filtAtt]['type'] = 'ebtwe';
            }
        }

        if (updateNow) {
            mkFiltText();
            updateFacetsData(true);
        }
     };


    var mkFiltText = function () {
        var hasTcga = false;
        var tcgaColSelected = false;
        if ((window.filterObj.hasOwnProperty('Program')) && (window.filterObj.Program.indexOf('TCGA')>-1)){
            tcgaColSelected = true;
            $('#tcga_clinical_heading').children('a').removeClass('disabled');
        }
        else
            {
                $('#tcga_clinical_heading').children('a').addClass('disabled');
                if (!($('#tcga_clinical_heading').children('a')).hasClass('collapsed')){
                    $('#tcga_clinical_heading').children('a').click();
                }
            }

        var curKeys = Object.keys(filterObj).sort();
        oStringA = new Array();
        var collection = new Array();
        for (i = 0; i < curKeys.length; i++) {
            var addKey = true;
            var curKey = curKeys[i];
            if (curKey.startsWith('Program')) {
                curArr = filterObj[curKey];
                for (var j = 0; j < curArr.length; j++) {
                    if (!(('Program.' + curArr[j]) in filterObj)) {
                        var colName=$('#'+curArr[j]).filter('.collection_name')[0].innerText;
                        collection.push(colName);
                    }
                }
            }
            else if (curKey.endsWith('_rng')) {
                var realKey = curKey.substring(0, curKey.length - 4).split('.').pop();
                var disp = $('#' + realKey + '_heading').children().children('.attDisp')[0].innerText;
                if (curKey.startsWith('tcga_clinical') && tcgaColSelected) {
                    disp = 'tcga.' + disp;
                    hasTcga = true;
                } else if (curKey.startsWith('tcga_clinical') && !tcgaColSelected) {
                    addKey = false;
                    break;
                }
                if (addKey) {
                    var fStr = '';
                    if ('rng' in filterObj[curKey]) {
                        fStr += filterObj[curKey]['rng'][0].toString() + '-' + (filterObj[curKey]['rng'][1]).toString();
                    }
                    if (('rng' in filterObj[curKey]) && ('none' in filterObj[curKey])) {
                        fStr += ', ';
                    }
                    if ('none' in filterObj[curKey]) {
                        fStr += 'None';
                    }

                    var nstr = '<span class="filter-type">' + disp + '</span> IN (<span class="filter-att">' + fStr + '</span>)';
                    oStringA.push(nstr);
                }
            }
            else {
                var realKey = curKey.split('.').pop();
                var disp = $('#' + realKey + '_heading').children().children('.attDisp')[0].innerText;
                if (curKey.startsWith('tcga_clinical') && tcgaColSelected) {
                    disp = 'tcga.' + disp;
                    hasTcga = true;
                } else if (curKey.startsWith('tcga_clinical') && !tcgaColSelected) {
                    addKey = false;
                    break;
                }
                if (addKey) {
                    var valueSpans = $('#' + realKey + '_list').children().children().children('input:checked').siblings('.value');
                    oVals = new Array();
                    valueSpans.each(function () {
                        oVals.push($(this).text())
                    });

                    var oArray = oVals.sort().map(item => '<span class="filter-att">' + item.toString() + '</span>');
                    nstr = '<span class="filter-type">' + disp + '</span>';
                    nstr += 'IN (' + oArray.join("") + ')';
                    oStringA.push(nstr);

                }
            }

        }
        if (hasTcga && tcgaColSelected) {
            $('#search_def_warn').show();
        } else {
            $('#search_def_warn').hide();
        }
        if (collection.length>0){
            var oArray = collection.sort().map(item => '<span class="filter-att">' + item.toString() + '</span>');
            nstr = '<span class="filter-type">Collection</span>';
            nstr += 'IN (' + oArray.join("") + ')';
            oStringA.unshift(nstr);
        }
        if (oStringA.length > 0) {
            var oString = oStringA.join(" AND");
            document.getElementById("search_def").innerHTML = '<p>' + oString + '</p>';
            document.getElementById('filt_txt').value=oString;
        } else {
            document.getElementById("search_def").innerHTML = '<span class="placeholder">&nbsp;</span>';
            document.getElementById('filt_txt').value="";
        }

    };
    var mkFiltTextm = function () {
        var hasTcga = false;
        var tcgaColSelected = false;
        if ((window.filterObj.hasOwnProperty('Program')) && (window.filterObj.Program.indexOf('TCGA') > -1)) {
            tcgaColSelected = true;
            $('#tcga_clinical_heading').children('a').removeClass('disabled');
        } else {
            $('#tcga_clinical_heading').children('a').addClass('disabled');
            if (!($('#tcga_clinical_heading').children('a')).hasClass('collapsed')) {
                $('#tcga_clinical_heading').children('a').click();
            }
        }

        var curKeys = Object.keys(filterObj).sort();
        oStringA = new Array();
        var collection = new Array();
        for (i = 0; i < curKeys.length; i++) {
            var addKey = true;
            var curKey = curKeys[i];
            if (curKey.startsWith('Program')) {
                curArr = filterObj[curKey];
                for (var j = 0; j < curArr.length; j++) {
                    if (!(('Program.' + curArr[j]) in filterObj)) {
                        var colName = $('#' + curArr[j]).filter('.collection_name')[0].innerText;
                        collection.push(colName);
                    }
                }
            } else if (curKey.endsWith('_rng')) {
                var realKey = curKey.substring(0, curKey.length - 4).split('.').pop();
                var disp = $('#' + realKey + '_heading').children().children('.attDisp')[0].innerText;
                if (curKey.startsWith('tcga_clinical') && tcgaColSelected) {
                    disp = 'tcga.' + disp;
                    hasTcga = true;
                } else if (curKey.startsWith('tcga_clinical') && !tcgaColSelected) {
                    addKey = false;
                    break;
                }

                if (collection.length > 0) {
                    var oArray = collection.sort().map(item => '<span class="filter-att">' + item.toString() + '</span>');
                    nstr = '<span class="filter-type">Collection</span>';
                    nstr += 'IN (' + oArray.join("") + ')';
                    oStringA.unshift(nstr);
                }

                if (oStringA.length > 0) {
                    var oString = oStringA.join(" AND");
                    document.getElementById("search_def").innerHTML = '<p>' + oString + '</p>';
                    document.getElementById('filt_txt').value = oString;
                } else {
                    document.getElementById("search_def").innerHTML = '<span class="placeholder">&nbsp;</span>';
                    document.getElementById('filt_txt').value = "";
                }

            }

        }
    };

    window.showGraphs = function(selectElem){
        $(selectElem).parent().siblings('.graph-set').show();
        $(selectElem).parent().siblings('.less-graphs').show();
        $(selectElem).parent().hide();
    }
    window.hideGraphs = function(selectElem){
        $(selectElem).parent().siblings('.graph-set').hide();
        $(selectElem).parent().siblings('.more-graphs').show();
        $(selectElem).parent().hide();
    }

    window.toggleGraphOverFlow = function(id, showMore){
        if (showMore) {
            $('.' + id).parent().find('.more-graphs').hide();
            $('.' + id).parent().find('.less-graphs').show();
            $('.' + id).find('.chart-overflow').removeClass('hide-chart');
        }
        else {
            $('.' + id).parent().find('.more-graphs').show();
            $('.' + id).parent().find('.less-graphs').hide();
            $('.' + id).find('.chart-overflow').addClass('hide-chart')
        }
    }

        window.addNone = function(elem, parStr, updateNow)
        {
            var id = parStr+$(elem).parent().parent()[0].id+"_rng";

            if (elem.checked){
                if (!(id in window.filterObj)) {
                    window.filterObj[id] = new Array();
                    window.filterObj[id]['type']='none';
                }
                window.filterObj[id]['none'] = true;
                //$(elem).parent().parent().addClass('isActive');
            }

            else{
                if ((id in window.filterObj) && ('none' in window.filterObj[id])){
                    delete window.filterObj[id]['none'];
                    if (!('rng' in window.filterObj[id])){
                        delete window.filterObj[id];
                        //$(elem).parent().parent().removeClass('isActive');
                    }
                }
            }

            var slideNm = $(elem).parent()[0].id+"_slide";
            mkFiltText();

            if (updateNow) {
                updateFacetsData(true);
            }
        }


        var mkSlider = function (divName, min, max, step, isInt, wNone, parStr, attr_id, attr_name, lower, upper, isActive,checked) {
            $('#'+divName).addClass('hasSlider');
            if (isActive){
                $('#'+divName).addClass('isActive');
            }

            var tooltipL = $('<div class="slide_tooltip tooltipL slide_tooltipT" />').text('stuff').css({
                position: 'absolute',
                top: -25,
                left: 0,
                transform: 'translateX(-50%)'

            });

             var tooltipR = $('<div class="slide_tooltip slide_tooltipB tooltipR" />').text('stuff').css({
               position: 'absolute',
               top: 20,
               right: 0,
                 transform: 'translateX(50%)'
             });


              var labelMin = $('<div class="labelMin"/>').text(min).css({
                  position: 'absolute',
                  top:-7,
                  left: -22,
                });


            var labelMax = $('<div class="labelMax" />').text(max);

            labelMax.css({
                position: 'absolute',
                top: -7,
                right: -14-8*max.toString().length,
                });



            var slideName = divName + '_slide';

            var inpName = divName + '_input';
            var strtInp = lower + '-' + upper;
            var nm=new Array();
            var filterCats= $('#'+divName).parentsUntil('.tab-pane','.list-group-item__body');
            for (var i=0;i<filterCats.length;i++){
                var ind = filterCats.length-1-i;
                nm.push(filterCats[ind].id);
            }
            nm.push(divName);
            var filtName = nm.join('.') + '_rng';
            //var filtName = nm;

            $('#' + divName).append('<div id="' + slideName + '"  data-attr-par="'+parStr+'"></div>');
            if ($('#'+divName).find('#'+inpName).length===0){
                $('#' + divName).append('<input id="' + inpName + '" type="text" value="' + strtInp + '" style="display:none">');
            }
            if ($('#'+divName).find('.reset').length===0){
                $('#' + divName).append(  '<button class="reset" style="display:block;margin-top:18px" onclick=\'setSlider("' + slideName + '",true,0,0,' + String(isInt) + ', true,"'+parStr+'")\'>Clear Slider</button>');
            }

             $('#'+slideName).append(labelMin);

             if (wNone){
                $('#' + divName).append( '<span class="noneBut"><input type="checkbox"   onchange="addNone(this, \''+parStr+'\', true)"> None </span>');
                $('#' + divName).find('.noneBut').find(':input')[0].checked = checked

             }


            $('#' + slideName).slider({
                values: [lower, upper],
                step: step,
                min: min,
                max: max,
                range: true,
                disabled: is_cohort,
                slide: function (event, ui) {
                      $('#' + inpName).val(ui.values[0] + "-" + ui.values[1]);

                     $(this).find('.slide_tooltip').each( function(index){
                        $(this).text( ui.values[index].toString() );

                    });

                },

                stop: function (event, ui) {
                    //setFromSlider(divName, filtName, min, max);
                    $('#' + slideName).addClass('used');
                    var val = $('#' + inpName)[0].value;
                    var valArr = val.split('-');

                    window.setSlider(slideName, false, valArr[0], valArr[1], isInt, true);

                }
            }).find('.ui-slider-range').append(tooltipL).append(tooltipR);


             $('#' + slideName).hover(
                    function(){
                        //$(this).removeClass("ui-state-active");
                       $(this).parent().find('.slide_tooltip');
                    }
                  ,
                    function(){
                       $(this).parent().find('.slide_tooltip');
                    }
                );


             $('#' + slideName).find(".slide_tooltip").each(function(index){
                        if (index ==0) {
                            $(this).text(lower.toString());
                        }
                        else{
                            $(this).text(upper.toString());
                        }
                   });

             $('#'+slideName).attr('min',min);
            $('#'+slideName).attr('max',max);


            $('#' + slideName).data("filter-attr-id",attr_id);
            $('#' + slideName).data("filter-display-attr",attr_name);

            $('#'+slideName).append(labelMax);


            $('#'+ divName+'_list').addClass('hide');
            $('#'+ divName).find('.more-checks').addClass('hide');
            $('#'+ divName).find('.less-checks').addClass('hide');
            $('#'+ divName).find('.hide-zeros').addClass('hide');
        };

        var updateTablesAfterFilter = function (collFilt, collectionsData){
            var usedCollectionData = new Array();
            var hasColl = collFilt.length>0 ? true : false;
            for (var i=0;i<window.collectionData.length;i++){
                var cRow = window.collectionData[i];
                var projId=cRow[0];
                if ( (projId in collectionsData) && (!hasColl || (collFilt.indexOf(projId)>-1)) ){
                    cRow[3] = collectionsData[projId]['count'];
                }
                else{
                   cRow[3] = 0;
                }
                if (cRow[3]===0){
                    var projIndex = window.selItems.selProjects.indexOf(projId);
                    if (projIndex !==-1) window.selItems.selProjects.splice(projIndex,1);
                    if (window.selItems.selCases.hasOwnProperty(projId)) {
                           selCases= window.selItems.selCases[projId];
                           for (j=0;j<selCases.length;j++){
                               var selCase = selCases[j];
                               delete window.selItems.selStudies[selCase];
                           }

                        delete window.selItems.selCases[projId];
                    }
                }
                else{
                    usedCollectionData.push(cRow);
                }

            }

            updateProjectTable(usedCollectionData);
            updateCaseTable(false, false, true, [false,false]);
        }


        window.updateProjectSelection = function(row){
            var purgeChildSelections=[false,false]
            var rowsAdded=true;
            projid= $(row).data('projectid');
            if ($(row).children('.ckbx').children().is(':checked') ) {
                if (window.selItems.selProjects.indexOf(projid) < 0) {
                       window.selItems.selProjects.push(projid);
                   }
            }
            else {
                rowsAdded = false;
                var removedProjects = new Array();
                if (window.selItems.selProjects.indexOf(projid) > -1) {
                    ind = window.selItems.selProjects.indexOf(projid);
                    window.selItems.selProjects.splice(ind,1);
                    removedProjects.push(projid);
                }
               if (removedProjects.length>0){
                   purgeChildSelections=cleanChildSelections(removedProjects,'projects',false);
               }
            }
            updateCaseTable(rowsAdded, !rowsAdded, false, purgeChildSelections)
        }

        window.updateMultipleRows=function(table,add,type){
            rowA=$(table).find('tbody').children();
            $(rowA).each(function(){
                    $(this).children('.ckbx').children().prop("checked",add);
            });
            updateCasesOrStudiesSelection(rowA, type);
        }

        window.updateCasesOrStudiesSelection = function(rowA, type){
            var purgeChildTables=[false];
            var rowsAdded= ($(rowA[0]).children('.ckbx').children().is(':checked') )?true:false

            if (rowsAdded) {
                $(rowA).each(function() {

                    if (type === 'cases') {
                        parentid = $(this).data('projectid');
                        childid = $(this).data('caseid');
                        curDic = window.selItems.selCases;
                        nextDic = window.selItems.selStudies;
                    } else if (type === 'studies') {
                        parentid = $(this).data('caseid');
                        childid = $(this).data('studyid');
                        curDic = window.selItems.selStudies;
                    }
                    if (!(parentid in curDic)) {
                        curDic[parentid] = new Array();
                    }
                    if (curDic[parentid].indexOf(childid) < 0) {
                        curDic[parentid].push(childid)
                    }

                });
            }
            else {
                rowsRemoved = new Array();
                $(rowA).each(function(){
                    if (type === 'cases') {
                        parentid = $(this).data('projectid');
                        childid = $(this).data('caseid');
                        curDic = window.selItems.selCases;
                        nextDic = window.selItems.selStudies;
                    }
                    else if (type === 'studies') {
                        parentid = $(this).data('caseid');
                        childid = $(this).data('studyid');
                        curDic = window.selItems.selStudies;
                    }

                    if (parentid in curDic) {
                        if (curDic[parentid].indexOf(childid) > -1) {
                            ind = curDic[parentid].indexOf(childid);
                            curDic[parentid].splice(ind, 1);
                            rowsRemoved.push(childid);
                            if (curDic[parentid].length==0){
                                delete curDic[parentid];
                            }
                        }

                    }
                 });
                 if ( (type ==='cases') && (rowsRemoved.length > 0)) {
                     purgeChildTables = cleanChildSelections(rowsRemoved, 'cases',false);
                 }

            }
            if (type==='cases'){
                updateStudyTable(rowsAdded,!rowsAdded,false,purgeChildTables);
            }
            else if (type==='studies'){
                updateSeriesTable(rowsAdded,!rowsAdded,false);
            }
        }


        cleanChildSelections = function(removedItems,itemType,cleanAll){
            var removedChildItems = new Array();
            var itemsRemoved = false;
            var updateChildTable = new Array();
            if (itemType ==='projects'){
                childDic=window.selItems.selCases
            }
            else if (itemType==='cases'){
                childDic=window.selItems.selStudies
            }
            if (cleanAll){
                removedItems = Object.keys(childDic);
            }
            for (i=0;i<removedItems.length;i++){
                id = removedItems[i];
                if (id in childDic)
                {
                    removedChildItems = removedChildItems.concat(childDic[id]);
                    delete childDic[id];
                }
            }
            if ((itemType==='projects') && ((removedChildItems.length>0)|| cleanAll)){
                let ret = cleanChildSelections(removedChildItems,'cases',cleanAll);
                updateChildTable = [true,ret[0]];
            }

            else {
                updateChildTable= ((removedChildItems.length>0) || cleanAll) ? [true]:[false]
            }
            return updateChildTable;
        }

        updateProjectTable = function(collectionData) {
            $('#proj_table').DataTable().destroy();
            $('#proj_table').DataTable(
                {
                    "dom": '<"dataTables_controls"ilpf>rt<"bottom"><"clear">',
                    "order": [[1, "asc"]],
                    "data": collectionData,
                    "createdRow": function (row, data, dataIndex) {
                        $(row).data('projectid', data[0]);
                        $(row).attr('id', 'project_row_' + data[0]);
                    },
                    "columnDefs": [
                        {className: "ckbx text_data", "targets": [0]},
                        {className: "projects_table_num_cohort", "targets": [3]},
                    ],
                    "columns": [
                        {
                            "type": "html", "orderable": false, render: function (data) {
                                if (window.selItems.selProjects.indexOf(data)>-1) {
                                    return '<input type="checkbox" onclick="updateProjectSelection($(this).parent().parent())" checked>'
                                }
                                else{
                                    return '<input type="checkbox" onclick="updateProjectSelection($(this).parent().parent())" >'
                                }
                            }
                        },
                        {"type": "text", "orderable": true},
                        {"type": "num", orderable: true},
                        {
                            "type": "num", orderable: true, "createdCell": function (td, data, row) {
                                $(td).attr('id', 'patient_col_' + row[0]);
                                return;
                            }
                        }
                    ]
                }
            );
            //"createdCell":function(td,data,row){$(td).attr("id","patient_col_"+row[1]);}
            $('#proj_table').children('tbody').attr('id', 'projects_table');
        }
//checkClientCache(request,'cases');

        var updateCache = function(cache,request,backendReqStrt, backendReqLength,data, colOrder){
            cache.lastRequest = request;
            cache.backendReqStrt=backendReqStrt;
            cache.backendReqLength=backendReqLength;
            cache.cacheLength = data['res'].length;
            cache.recordsTotal = data['cnt'];
            cache.data = data['res'];
            cache.colOrder = colOrder;

        }
        var checkClientCache = function(request, type){
            var cache;
            var reorderNeeded = false;
            var updateNeeded = true;
            if (request.draw ===1){
                updateNeeded = true;
            }
            else {
                if (type === 'cases') {
                    cache = window.casesCache;
                } else if (type === 'studies') {
                    cache = window.studiesCache;
                } else if (type === 'series') {
                    cache = window.seriesCache;
                }

                if ((cache.lastRequest.order[0]['column'] === request.order[0]['column']) && (cache.lastRequest.order[0]['dir'] === request.order[0]['dir'])) {
                    if ( (cache.backendReqStrt<=request.start) && ( (cache.backendReqStrt+cache.backendReqLength) >= (request.start+request.length)  )){
                        updateNeeded=false;
                    }
                    else{
                        updateNeeded = true;
                    }
                } else if (cache.cacheLength===cache.recordsTotal){
                    updateNeeded = false;
                    reorderNeeded=true;
                }
                else {
                    updateNeeded = true;
                }
            }
            return [updateNeeded , reorderNeeded];
        }

        reorderCacheData = function(cache,request,thead){
            var dir = request.order[0]['dir'];
            var colId = parseInt(request.order[0]['column']);
            var col = cache.colOrder[colId];
            var ntmp  = cache.data.slice(0,3);
            var rtmp = new Array();
            if ($(thead.children('tr').children().get(col)).hasClass('numeric_data')){
                if (dir==='asc'){
                    cache.data=cache.data.sort((a,b) => (parseFloat(a[col])- parseFloat(b[col]) ) );
                }
                else{
                    cache.data=cache.data.sort((a,b)=> (parseFloat(b[col]) -parseFloat(a[col])) );
                }
            }
            else{
                if (dir==='asc'){
                    cache.data=cache.data.sort((a,b)=> (a[col]<=b[col]) ? 1 : -1 );
                }
                else{
                    cache.data=cache.data.sort((a,b)=> (b[col]<=a[col]) ? 1: -1);
                }

            }

        }

        window.changePage = function(wrapper){
            var elem=$('#'+wrapper);
            var valStr = elem.find('.dataTables_controls').find('.goto-page-number').val();
            try {
                var val =parseInt(valStr);
                if (Number.isInteger(val) && (val>0) ) {
                    elem.find('table').DataTable().page(val-1).draw(false);
                }
            }
            catch(err){
               console.log(err);
            }

        }

        window.updateCaseTable = function(rowsAdded, rowsRemoved, refreshAfterFilter,updateChildTables) {

            $('#cases_tab').data('rowsremoved',rowsRemoved);
            $('#cases_tab').data('refreshafterfilter',refreshAfterFilter);
            $('#cases_tab').data('updatechildtables',updateChildTables);
            $('#cases_tab').DataTable().destroy();
            $('#cases_tab').DataTable({
                "autoWidth": false,
                "dom": '<"dataTables_controls"ilp>rt<"bottom"><"clear">',
                "order": [[2, "asc"]],
                "createdRow":function(row,data,dataIndex){
                    $(row).attr('id','case_'+data['PatientID'])
                    $(row).attr('data-projectid',data['collection_id']);
                    $(row).attr('data-caseid',data['PatientID']);
                    $(row).addClass('text_head');
                    $(row).addClass('project_'+data['collection_id']);
                },
                "columnDefs":[
                    {className:"ckbx", "targets":[0]},
                    {className:"col1 project-name", "targets":[1]},
                    {className:"col1 case-id", "targets":[2]},
                    {className:"col1 numrows", "targets":[3]},
                    {className:"col1", "targets":[4]},
                  ],
                "columns": [
                    {"type":"html", "orderable":false, "data":"PatientID", render:function(PatientID, type, row){
                          collection_id=row['collection_id'][0];
                          if ((collection_id in window.selItems.selCases)  && (window.selItems.selCases[collection_id].indexOf(PatientID)>-1)){
                              return '<input type="checkbox" class="tbl-sel" checked="true" onclick="updateCasesOrStudiesSelection([$(this).parent().parent()],\'cases\')">';
                          }
                          else{
                              return '<input type="checkbox" class="tbl-sel" onclick="updateCasesOrStudiesSelection([$(this).parent().parent()],\'cases\')">';
                          }
                       }
                    },

                    {"type": "text", "orderable": true, data:'collection_id', render:function(data){
                        var projectNm = $('#'+data).filter('.collection_name')[0].innerText;
                        return projectNm;
                        } },
                    {"type": "text", "orderable": true, data:'PatientID', render:function(data){
                        return data;
                        }},
                    {"type": "num", "orderable": true, data:'unique_study'},
                    {"type": "num", "orderable": true, data:'unique_series'}
                ],
                "processing": true,
                "serverSide": true,
                "ajax": function (request, callback, settings) {
                    var backendReqLength = 500;
                    var backendReqStrt = Math.max(0, request.start - Math.floor(backendReqLength * 0.5));

                    $('.spinner').show();
                    var rowsRemoved = $('#cases_tab').data('rowsremoved');
                    var refreshAfterFilter = $('#cases_tab').data('refreshafterfilter');
                    var updateChildTables = $('#cases_tab').data('updatechildtables');
                    var checkIds = new Array();
                    var cols = ['', 'collection_id', 'PatientID', 'StudyInstanceUID', 'SeriesInstanceUID'];
                    var ssCallNeeded = true;
                    if (window.selItems.selProjects.length === 0) {
                        ssCallNeeded = false;
                        $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                        updateChildTables = cleanChildSelections([], 'cases', true);

                        updateStudyTable(false,true,refreshAfterFilter,[updateChildTables[1]]);
                        $('.spinner').hide();
                        callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                    } else {

                        var ret = checkClientCache(request, 'cases');
                        var ssCallNeeded = ret[0];
                        var reorderNeeded = ret[1];

                        if (ssCallNeeded) {
                            if (refreshAfterFilter) {
                                for (projid in window.selItems.selCases) {
                                    checkIds = checkIds.concat(window.selItems.selCases[projid])

                                }
                            }
                            curFilterObj = JSON.parse(JSON.stringify(parseFilterObj()));
                            curFilterObj.collection_id = window.selItems.selProjects;
                            var filterStr = JSON.stringify(curFilterObj);
                            let url = '/tables/cases/';
                            url = encodeURI(url);
                            ndic = {'filters': filterStr, 'limit': 2000}
                            ndic['checkids'] = JSON.stringify(checkIds);

                            if (typeof (window.csr) !== 'undefined') {
                                ndic['csrfmiddlewaretoken'] = window.csr
                            }

                            ndic['offset'] = backendReqStrt;
                            ndic['limit'] = backendReqLength;

                            if (typeof (request.order) !== 'undefined') {
                                if (typeof (request.order[0].column) !== 'undefined') {
                                    ndic['sort'] = cols[request.order[0].column];
                                }
                                if (typeof (request.order[0].dir) !== 'undefined') {
                                    ndic['sortdir'] = request.order[0].dir;
                                }
                            }

                            $.ajax({
                                url: url,
                                dataType: 'json',
                                data: ndic,
                                type: 'post',
                                contentType: 'application/x-www-form-urlencoded',
                                success: function (data) {
                                    window.casesCache = new Object();
                                    colSort = ["", "collection_id", "PatientID", "unique_study", "unique_series"];
                                    updateCache(window.casesCache, request, backendReqStrt, backendReqLength, data, colSort);
                                    dataset = data['res'].slice(request.start - backendReqStrt, request.start - backendReqStrt + request.length);

                                    /* for (set in dataset) {
                                        set['ids'] = {'PatientID': set['PatientID'], 'collection_id': set['collection_id']}
                                    }*/
                                    if (dataset.length > 0) {
                                        $('#cases_tab').children('thead').children('tr').children('.ckbx').removeClass('notVis');
                                    } else {
                                        $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    }

                                    if (refreshAfterFilter && (data['diff'].length > 0)) {
                                        for (projid in window.selItems.selCases) {
                                            for (var i = 0; i < window.selItems.selCases[projid].length; i++) {
                                                caseid = window.selItems.selCases[projid][i];
                                                var ind = data['diff'].indexOf(caseid);
                                                if (ind > -1) {
                                                    window.selItems.selCases[projid].splice(i, 1);
                                                    i--;
                                                }
                                            }
                                            if (window.selItems.selCases[projid].length === 0) {
                                                delete window.selItems.selCases[projid];
                                            }
                                        }
                                        updateChildTables = cleanChildSelections(data['diff'], 'cases', false)
                                        updateStudyTable(false, true, true, true);
                                    } else if (updateChildTables[0]) {
                                        updateStudyTable(false, true, false, [updateChildTables[1]])
                                    }

                                    $('.spinner').hide();
                                    callback({
                                        "data": dataset,
                                        "recordsTotal": data["cnt"],
                                        "recordsFiltered": data["cnt"]
                                    })

                                },
                                error: function () {
                                    console.log("problem getting data");
                                    $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    $('.spinner').hide();
                                    callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})

                                }
                            });
                        } else {
                            if (reorderNeeded) {
                                reorderCacheData(window.casesCache, request, $('#cases_table_head'));
                            }
                            dataset = window.casesCache.data.slice(request.start - window.casesCache.backendReqStrt, request.start - window.casesCache.backendReqStrt + request.length);
                            window.casesCache.lastRequest = request;
                            $('.spinner').hide();
                            callback({
                                "data": dataset,
                                "recordsTotal": window.casesCache.recordsTotal,
                                "recordsFiltered": window.casesCache.recordsTotal
                            })
                        }

                    }
                }

            });
            $('#cases_tab').on('draw.dt', function(){
                $('#cases_table_head').children('tr').children().each(function(){
                    this.style.width=null;
                    }

                );

            })
            $('#cases_tab').find('tbody').attr('id','cases_table');
            $('#cases_panel').find('.dataTables_controls').find('.dataTables_length').after('<div class="dataTables_goto_page"><label>Page </label><input class="goto-page-number" type="number"><button onclick="changePage(\'cases_tab_wrapper\')">Go</button></div>');

        }

        window.updateStudyTable = function(rowsAdded, rowsRemoved, refreshAfterFilter,updateChildTables) {

            $('#studies_tab').data('rowsremoved',rowsRemoved);
            $('#studies_tab').data('refreshafterfilter',refreshAfterFilter);
            $('#studies_tab').data('updatechildtables',updateChildTables);


            $('#studies_tab').DataTable().destroy();
            $('#studies_tab').DataTable({
                "autoWidth": false,
                "dom": '<"dataTables_controls"ilp>rt<"bottom"><"clear">',
                "order": [[1, "asc"]],
                "createdRow":function(row,data,dataIndex){
                    $(row).attr('id','study_'+data['StudyInstanceUID'])
                    $(row).attr('data-studyid',data['StudyInstanceUID']);
                    $(row).attr('data-caseid',data['PatientID']);
                    $(row).addClass('text_head');
                    $(row).addClass('project_'+data['collection_id']);
                    $(row).addClass('case_'+data['PatientID']);

                },
                "columnDefs":[
                    {className:"ckbx", "targets":[0]},
                    {className:"col1 case-id", "targets":[1]},
                    {className:"col2 study-id study-id-col", "targets":[2]},
                    {className:"col1 study-description", "targets":[3]},
                    {className:"col1 numrows", "targets":[4]},
                    {className:"ohif open-viewer", "targets":[5]},

                  ],
                "columns": [
                    {"type":"html", "orderable":false, data:'StudyInstanceUID', render:function(data,type, row){
                        var PatientID=row['PatientID'];
                        if ((PatientID in window.selItems.selStudies)  && (window.selItems.selStudies[PatientID].indexOf(data)>-1)){
                              return '<input type="checkbox" class="tbl-sel" checked="true" onclick="updateCasesOrStudiesSelection([$(this).parent().parent()],\'studies\')">';
                          }
                          else{
                              return '<input type="checkbox" class="tbl-sel" onclick="updateCasesOrStudiesSelection([$(this).parent().parent()],\'studies\')">';
                          }
                       }
                    },
                    {"type": "text", "orderable": true, data:'PatientID', render:function(data){
                        return data;
                        } },
                    {"type": "text", "orderable": true, data:'StudyInstanceUID', render:function(data){
                        return pretty_print_id(data);
                        },
                        "createdCell":function(td,data)
                        {
                            $(td).attr('data-study-id',data);
                            return;
                       }

                    },
                    {"type": "num", "orderable": true, data:'StudyDescription'},
                    {"type": "num", "orderable": true, data:'unique_series'},
                    {"type": "html", "orderable": false, data:'StudyInstanceUID', render:function(data,type,row){
                        var modality = row['Modality'];
                        if ((modality[0]==='SM') || (modality==='SM')){
                            return '<a href="' + SLIM_VIEWER_PATH + data + '" target="_blank"><i class="fa fa-eye"></i>'
                        }
                        else {
                            return '<a href="' + DICOM_STORE_PATH + data + '" target="_blank"><i class="fa fa-eye"></i>'
                        }
                    }

                    },

                ],
                "processing": true,
                "serverSide": true,
                "ajax": function (request, callback, settings, refreshAfterFilter) {
                    var backendReqLength = 500;
                    var backendReqStrt = Math.max(0, request.start - Math.floor(backendReqLength * 0.5));

                    $('.spinner').show();
                    var rowsRemoved = $('#studies_tab').data('rowsremoved');
                    var refreshAfterFilter = $('#studies_tab').data('refreshafterfilter');
                    var updateChildTables = [$('#studies_tab').data('updatechildtables')];
                    var cols = ['', 'PatientID', 'StudyInstanceUID', 'StudyDescription', 'SeriesInstanceUID'];
                    var ssCallNeeded = true;

                    var caseArr = new Array();
                    for (projectid in window.selItems.selCases) {
                        for (var i = 0; i < window.selItems.selCases[projectid].length; i++) {
                            caseArr.push(window.selItems.selCases[projectid][i]);
                        }
                    }

                    if (caseArr.length === 0) {
                        ssCallNeeded = false;
                        $('#studies_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                        if (refreshAfterFilter || updateChildTables[0]) {
                            updateSeriesTable(false,true,false)
                        }
                        $('.spinner').hide();
                        callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"});
                    } else {
                        var ret = checkClientCache(request, 'studies');
                        ssCallNeeded = ret[0];
                        var reorderNeeded = ret[1];

                        if (ssCallNeeded) {
                            //curFilterObj = JSON.parse(JSON.stringify(parseFilterObj()));
                            curFilterObj = new Object();
                            curFilterObj.collection_id = window.selItems.selProjects;
                            curFilterObj.PatientID = caseArr;
                            var filterStr = JSON.stringify(curFilterObj);

                            let url = '/tables/studies/';
                            url = encodeURI(url);
                            ndic = {'filters': filterStr, 'limit': 2000}
                            if (typeof (window.csr) !== 'undefined') {
                                ndic['csrfmiddlewaretoken'] = window.csr
                            }

                            ndic['offset'] = backendReqStrt;
                            ndic['limit'] = backendReqLength;

                            if (typeof (request.order) !== 'undefined') {
                                if (typeof (request.order[0].column) !== 'undefined') {
                                    ndic['sort'] = cols[request.order[0].column];
                                }
                                if (typeof (request.order[0].dir) !== 'undefined') {
                                    ndic['sortdir'] = request.order[0].dir;
                                }
                            }

                            $.ajax({
                                url: url,
                                dataType: 'json',
                                data: ndic,
                                type: 'post',
                                contentType: 'application/x-www-form-urlencoded',
                                success: function (data) {
                                    window.studiesCache = new Object();
                                    updateCache(window.studiesCache, request, backendReqStrt, backendReqLength, data, cols);
                                    dataset = data['res'].slice(request.start - backendReqStrt, request.start - backendReqStrt + request.length);
                                    if (dataset.length > 0) {
                                        $('#studies_tab').children('thead').children('tr').children('.ckbx').removeClass('notVis');
                                    } else {
                                        $('#studies_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    }

                                    if (refreshAfterFilter || updateChildTables[0]) {
                                        updateSeriesTable(false, true, false)
                                    }

                                    $('.spinner').hide();
                                    callback({
                                        "data": dataset,
                                        "recordsTotal": data["cnt"],
                                        "recordsFiltered": data["cnt"]
                                    })

                                },
                                error: function () {
                                    console.log("problem getting data");
                                    $('.spinner').hide();
                                    $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                                }
                            });
                        } else {
                            if (reorderNeeded) {
                                reorderCacheData(window.studiesCache, request, $('#studies_table_head'));
                            }
                            dataset = window.studiesCache.data.slice(request.start - window.studiesCache.backendReqStrt, request.start - window.studiesCache.backendReqStrt + request.length);
                            window.studiesCache.lastRequest = request;
                            $('.spinner').hide();
                            callback({
                                "data": dataset,
                                "recordsTotal": window.studiesCache.recordsTotal,
                                "recordsFiltered": window.studiesCache.recordsTotal
                            })
                        }
                    }
                }

            });

            $('#studies_tab').on('draw.dt', function(){
                $('#studies_table_head').children('tr').children().each(function(){
                    this.style.width=null;
                    }

                );
            })
            $('#studies_tab').children('tbody').attr('id','studies_table');
            $('#studies_tab_wrapper').find('.dataTables_controls').find('.dataTables_length').after('<div class="dataTables_goto_page"><label>Page </label><input class="goto-page-number" type="number"><button onclick="changePage(\'studies_tab_wrapper\')">Go</button></div>');
        }

        window.updateSeriesTable = function(rowsAdded, rowsRemoved, refreshAfterFilter) {

            $('#series_tab').attr('data-rowsremoved',rowsRemoved);
            $('#series_tab').attr('data-refreshafterfilter',refreshAfterFilter);
            $('#series_tab').DataTable().destroy();
            $('#series_tab').DataTable({
                "autoWidth": false,
                "dom": '<"dataTables_controls"ilp>rt<"bottom"><"clear">',
                "order": [[0, "asc"]],
                "createdRow":function(row,data,dataIndex){
                    $(row).attr('id','series_'+data['SeriesInstanceUID'])
                    $(row).addClass('text_head');


                },
                "columnDefs":[
                    {className:"col1 study-id study-id-col", "targets":[0]},
                    {className:"series-number", "targets":[1]},
                    {className:"col1 modality", "targets":[2]},
                    {className:"col1 body-part-examined", "targets":[3]},
                    {className:"series-description", "targets":[4]},
                    {className:"ohif open-viewer", "targets":[5]},

                  ],
                "columns": [

                    {"type": "text", "orderable": true, data:'StudyInstanceUID', render:function(data){
                        return pretty_print_id(data);
                        }, "createdCell":function(td,data)
                        {
                            $(td).attr('data-study-id',data);
                            return;
                       }

                    },
                    {"type": "num", "orderable": true, data:'SeriesNumber'},
                    {"type": "text", "orderable": true, data:'Modality'},
                    {"type": "text", "orderable": true, data:'BodyPartExamined'},
                    {"type": "text", "orderable": true, data:'SeriesDescription', render:function(data){
                        if (data.length>1){
                         return data[0]+',...';
                        }
                        else if(data.length===1){
                            return data[0];
                        }
                        else{
                           return '';
                        }
                    },
                       "createdCell":function(td,data)
                        {
                            if (data.length>1) {
                                $(td).attr('data-description', data);
                                $(td).addClass('description-tip');
                                return;

                            }
                       }
                    },
                    {"type": "html", "orderable": false, data:'SeriesInstanceUID', render:function(data,type, row){
                          if ( (row['Modality']==='SEG' || row['Modality'][0]==='SEG') || (row['Modality']==='RTSTRUCT' || row['Modality'][0]==='RTSTRUCT') || (row['Modality']==='RTPLAN' || row['Modality'][0]==='RTPLAN') || (row['Modality']==='RWV' || row['Modality'][0]==='RWV')){
                                 return '<a href="/" onclick="return false;"><i class="fa fa-eye-slash no-viewer-tooltip"></i>';

                            }
                          else if ( (row['Modality']==='SM') ){
                              return '<a href="' + SLIM_VIEWER_PATH  + data + '" target="_blank"><i class="fa fa-eye"></i>'
                          }
                          else {
                              return '<a href="' + DICOM_STORE_PATH + row['StudyInstanceUID'] + '?SeriesInstanceUID=' + data + '" target="_blank"><i class="fa fa-eye"></i>'
                          }
                        }

                    },

                ],
                "processing": true,
                "serverSide": true,
                "ajax": function (request, callback, settings, refreshAfterFilter) {
                    $('.spinner').show();

                    var backendReqLength = 500;
                    var backendReqStrt = Math.max(0, request.start - Math.floor(backendReqLength * 0.5));
                    var rowsRemoved = $('#series_tab').data('rowsremoved');
                    var refreshAfterFilter = $('#series_tab').data('refreshafterfilter');
                    var cols = ['StudyInstanceUID', 'SeriesNumber', 'Modality', 'BodyPartExamined', 'SeriesDescription']
                    var ssCallNeeded = true;
                    var caseArr = new Array();
                    for (caseid in window.selItems.selCases) {
                        for (var i = 0; i < window.selItems.selCases[caseid].length; i++) {
                            caseArr.push(window.selItems.selCases[caseid][i]);
                        }
                    }

                    var studyArr = new Array();
                    for (caseid in window.selItems.selStudies) {
                        for (var i = 0; i < window.selItems.selStudies[caseid].length; i++) {
                            studyArr.push(window.selItems.selStudies[caseid][i]);
                        }
                    }
                    if (studyArr.length == 0) {
                        ssCallNeeded = false;
                        $('#series_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                        $('.spinner').hide();
                        callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"});
                    } else {
                        var ret = checkClientCache(request, 'series');
                        ssCallNeeded = ret[0]
                        var reorderNeeded = ret[1];

                        if (ssCallNeeded) {
                            //curFilterObj = JSON.parse(JSON.stringify(parseFilterObj()));
                            curFilterObj.collection_id = window.selItems.selProjects;
                            curFilterObj.PatientID = caseArr;
                            curFilterObj.StudyInstanceUID = studyArr;

                            var filterStr = JSON.stringify(curFilterObj);

                            let url = '/tables/series/';
                            url = encodeURI(url);
                            ndic = {'filters': filterStr, 'limit': 2000}
                            if (typeof (window.csr) !== 'undefined') {
                                ndic['csrfmiddlewaretoken'] = window.csr
                            }

                            ndic['offset'] = backendReqStrt;
                            ndic['limit'] = backendReqLength;

                            if (typeof (request.order) !== 'undefined') {
                                if (typeof (request.order[0].column) !== 'undefined') {
                                    ndic['sort'] = cols[request.order[0].column];
                                }
                                if (typeof (request.order[0].dir) !== 'undefined') {
                                    ndic['sortdir'] = request.order[0].dir;
                                }
                            }

                            $.ajax({
                                url: url,
                                dataType: 'json',
                                data: ndic,
                                type: 'post',
                                contentType: 'application/x-www-form-urlencoded',
                                success: function (data) {
                                    window.seriesCache = new Object();
                                    var colSort = ['StudyInstanceUID','SeriesNumber','Modality','BodyPartExamined','SeriesDescription']
                                    updateCache(window.seriesCache, request,backendReqStrt, backendReqLength, data,colSort)
                                    dataset = data['res'].slice(request.start - backendReqStrt, request.start - backendReqStrt + request.length);

                                    $('.spinner').hide();
                                    callback({
                                        "data": dataset,
                                        "recordsTotal": data["cnt"],
                                        "recordsFiltered": data["cnt"]
                                    })

                                },
                                error: function () {
                                    console.log("problem getting data");
                                    $('.spinner').hide();
                                    $('#cases_tab').children('thead').children('tr').children('.ckbx').addClass('notVis');
                                    callback({"data": [], "recordsTotal": "0", "recordsFiltered": "0"})
                                }
                            });
                        }
                        else{
                            if (reorderNeeded) {
                                reorderCacheData(window.seriesCache, request, $('#series_table_head'));
                            }
                            dataset = window.seriesCache.data.slice(request.start - window.seriesCache.backendReqStrt, request.start - window.seriesCache.backendReqStrt + request.length);
                            window.seriesCache.lastRequest = request;
                            $('.spinner').hide();
                            callback({
                                "data": dataset,
                                "recordsTotal": window.seriesCache.recordsTotal,
                                "recordsFiltered": window.seriesCache.recordsTotal
                            })

                        }
                    }
                }

            });

            $('#series_tab').on('draw.dt', function(){
                $('#series_table_head').children('tr').children().each(function(){
                    this.style.width=null;
                    }

                );
            })

            $('#series_tab').children('tbody').attr('id','series_table');
            $('#series_tab_wrapper').find('.dataTables_controls').find('.dataTables_length').after('<div class="dataTables_goto_page"><label>Page </label><input class="goto-page-number" type="number"><button onclick="changePage(\'series_tab_wrapper\')">Go</button></div>');

        }

        /* var changeAjax = function (isIncrement) {
            if (isIncrement) {
                $('#number_ajax')[0].value = String(parseInt($('#number_ajax')[0].value) + 1);
            } else {
                $('#number_ajax')[0].value = String(parseInt($('#number_ajax')[0].value) - 1);
            }
            //alert($('#number_ajax')[0].value)

            if ($('#number_ajax')[0].value === '0') {
                $('.spinner').hide();
            } else {
                $('.spinner').show();
            }
        } */

        var pretty_print_id = function (id) {
            var newId = id.slice(0, 12) + '...' + id.slice(id.length - 12, id.length);
            return newId;
        }

        window.updateSearchScope = function (searchElem) {
            var project_scope = searchElem.selectedOptions[0].value;
            mkFiltText();
            updateFacetsData(true);
        }


        var updateCollectionTotals = function(listId, progDic){
            var reformDic = new Object();
            reformDic[listId] = new Object();
            for (item in progDic){
                if ((item !=='All') && (item !=='None') && (item in window.programs) && (Object.keys(progDic[item]['projects']).length>0)){
                    if ( Object.keys(window.programs[item]['projects']).length===1) {
                        nitem=Object.keys(progDic[item]['projects'])[0];
                        reformDic[listId][nitem]=new Object();
                        reformDic[listId][nitem]['count'] = progDic[item]['val'];
                    }
                    else {
                        reformDic[listId][item]=new Object();
                        reformDic[listId][item]['count'] = progDic[item]['val'];
                        reformDic[item] =  new Object();
                        for (project in progDic[item]['projects']){
                            reformDic[item][project]=new Object();
                            reformDic[item][project]['count']=progDic[item]['projects'][project]['val'];
                        }
                    }


                }
            }
            updateFilterSelections('program_set', {'unfilt':reformDic});
            updateColl();
        }

        var parseFilterObj = function (){
            var hasTcgaCol=false;
            if ((window.filterObj.hasOwnProperty('Program')) && (window.filterObj.Program.indexOf('TCGA')>-1)){
                hasTcgaCol=true;
            }
            collObj=new Array();
            filtObj = new Object();
            for (ckey in window.filterObj){
                if (ckey ==='Program'){
                    for (ind=0;ind<window.filterObj[ckey].length;ind++){
                        program = window.filterObj[ckey][ind];
                        if (program in window.projSets){
                            if (!('Program.'+program in window.filterObj)){
                               collObj= collObj.concat(window.projSets[program]);
                            }
                        } else {
                            collObj.push(program);
                        }
                    }
                } else if (ckey.startsWith('Program.')){
                     for (ind=0;ind<window.filterObj[ckey].length;ind++){
                         collObj.push(window.filterObj[ckey][ind]);
                     }
                } else if (!(ckey).startsWith('tcga_clinical') || hasTcgaCol){
                    nmA = ckey.split('.');
                    nm=nmA[nmA.length-1];
                    if (nm.endsWith('_rng')){
                        if (window.filterObj[ckey].type==='none'){
                            nm=nm.replace('_rng','');
                        } else {
                            nm = nm.replace('_rng', '_' + window.filterObj[ckey].type);
                        }
                        if (  ('rng' in window.filterObj[ckey]) && ('none' in window.filterObj[ckey]) ){
                            filtObj[nm] = [window.filterObj[ckey]['rng'],'None']
                        } else if ('rng' in window.filterObj[ckey]){
                            filtObj[nm] = window.filterObj[ckey]['rng']
                        } else if ('none' in window.filterObj[ckey]){
                            noneKey=nm.replace('_rng','');
                            filtObj[noneKey]=['None'];
                        }
                    } else {
                        filtObj[nm] = window.filterObj[ckey];
                    }
                }
            }
            if (collObj.length>0){
                filtObj['collection_id']= collObj.sort();
            }
            return filtObj;
        };

        var updateFacetsData = function (newFilt) {
            $('.spinner').show();
            //changeAjax(true);
            //var url = '/explore/?counts_only=True&is_json=true&is_dicofdic=True&data_source_type=' + ($("#data_source_type option:selected").val() || 'S');
            var url = '/explore/'
            var parsedFiltObj=parseFilterObj();
            if (Object.keys(parsedFiltObj).length > 0) {
                 url += '&filters=' + JSON.stringify(parsedFiltObj);
                 //url += '&filters='+JSON.stringify({"age_at_diagnosis":['None' ]});
            }

            url = encodeURI(url);
            url= encodeURI('/explore/')

            ndic={'counts_only':'True', 'is_json':'True', 'is_dicofdic':'True', 'data_source_type':($("#data_source_type option:selected").val() || 'S'), 'filters':JSON.stringify(parsedFiltObj) }
            if (typeof(window.csr) !=='undefined'){
                ndic['csrfmiddlewaretoken'] = window.csr
            }


            let deferred = $.Deferred();
            $.ajax({
                url: url,
                data: ndic,
                dataType: 'json',
                type: 'post',

                contentType: 'application/x-www-form-urlencoded',
                success: function (data) {
                    var isFiltered = Boolean($('#search_def p').length>0);
                    if (is_cohort) {
                        if (file_parts_count > display_file_parts_count) {
                            $('#file-export-option').prop('title', 'Your cohort exceeds the maximum for download.');
                            $('#file-export-option input').prop('disabled', 'disabled');
                            $('#file-export-option input').prop('checked', false);
                            $('#file-manifest').hide();
                            if(!user_is_social) {
                                $('#need-social-account').show();
                            } else {
                                $('#file-manifest-max-exceeded').show();
                                $('#bq-export-option input').prop('checked', true).trigger("click");
                            }
                        } else {
                            $('#file-manifest-max-exceeded').hide();
                            $('#file-manifest').show();

                            var select_box_div = $('#file-part-select-box');
                            var select_box = select_box_div.find('select');
                            if (file_parts_count > 1) {
                                select_box_div.show();
                                for (let i = 0; i < display_file_parts_count; ++i) {
                                    select_box.append($('<option/>', {
                                        value: i,
                                        text : "File Part " + (i + 1)
                                    }));
                                }
                            } else {
                                select_box_div.hide();
                            }
                        }
                    } else {
                        if (isFiltered && data.total > 0){
                            $('#save-cohort-btn').prop('disabled','');
                            if(user_is_auth) {
                                $('#save-cohort-btn').prop('title','');
                            }
                        } else {
                            $('#save-cohort-btn').prop('disabled','disabled');
                            if (data.total<=0){
                                window.alert('There are no cases matching the selected set of filters.')
                            }
                            if(user_is_auth) {
                                $('#save-cohort-btn').prop('title',data.total > 0 ? 'Please select at least one filter.' : 'There are no cases in this cohort.');
                            } else {
                                $('#save-cohort-btn').prop('title','Log in to save.');
                            }
                        }
                    }
                    //updateCollectionTotals(data.total, data.origin_set.attributes.collection_id);
                    updateCollectionTotals('Program', data.programs);
                    //updateFilterSelections('search_orig_set', data.origin_set.All.attributes);

                    dicofdic= {'unfilt': data.origin_set.All.attributes, 'filt':''}
                    if (isFiltered){
                        dicofdic['filt']=data.filtered_counts.origin_set.All.attributes;
                    } else {
                        dicofdic['filt']=data.origin_set.All.attributes;
                    }

                    updateFilterSelections('search_orig_set', dicofdic);
                    createPlots('search_orig_set');

                    var derivedAttrs = Array.from($('#search_derived_set').children('.list-group').children('.list-group-item').children('.list-group-item__body').map( function() {return this.id;}  ));

                     if (data.hasOwnProperty('derived_set')) {
                        $('#search_derived_set').removeClass('disabled');
                        for (facetSet in data.derived_set){
                            if ('attributes' in data.derived_set[facetSet]){
                                dicofdic = {'unfilt': data.derived_set[facetSet].attributes, 'filt': ''}
                                if (isFiltered && data.filtered_counts.hasOwnProperty('derived_set')
                                    && data.filtered_counts.derived_set.hasOwnProperty(facetSet)
                                    && data.filtered_counts.derived_set[facetSet].hasOwnProperty('attributes')
                                ) {
                                    dicofdic['filt'] = data.filtered_counts.derived_set[facetSet].attributes;
                                }
                                else if (isFiltered)
                                    {
                                    dicofdic['filt'] = {};
                                }
                                else{
                                    dicofdic['filt'] = data.derived_set[facetSet].attributes;
                                }
                                updateFilterSelections(data.derived_set[facetSet].name, dicofdic);
                                var derivedAttrIndex = derivedAttrs.indexOf(data.derived_set[facetSet].name);

                                if (derivedAttrIndex>-1) {
                                    derivedAttrs.splice(derivedAttrIndex,1);
                                }
                            }
                        }
                    } else{
                        $('#search_derived_set').addClass('disabled');
                    }

                    for (var i=0; i< derivedAttrs.length;i++) {
                        updateFilterSelections(derivedAttrs[i], {});
                    }

                    createPlots('search_derived_set');

                    if (data.hasOwnProperty('related_set')) {
                        $('#search_related_set').removeClass('disabled');
                        dicofdic = {'unfilt':data.related_set.All.attributes, 'filt':''  }
                        if (isFiltered){
                            dicofdic['filt'] = data.filtered_counts.related_set.All.attributes;
                        } else{
                            dicofdic['filt'] = data.related_set.All.attributes;
                        }
                        updateFilterSelections('search_related_set', dicofdic);
                        //createPlots('tcga_clinical');
                    }
                    else{
                        $('#search_related_set').addClass('disabled');
                        updateFilterSelections('search_related_set', {});
                    }

                    createPlots('search_related_set');

                    var collFilt = new Array();
                    if ('collection_id' in parsedFiltObj){
                        collFilt=parsedFiltObj['collection_id'];
                        var ind=0;
                        while (ind <window.selItems.selProjects.length) {
                            proj=window.selItems.selProjects[ind]
                            if (  (collFilt.indexOf(proj)>-1)){
                                ind++
                            } else{
                                window.selItems.selProjects.splice(ind,1);
                                if (proj in window.selItems.selStudies){
                                    delete window.selItems.selStudies[proj];
                                }
                            }
                        }
                    }

                    updateTablesAfterFilter(collFilt,data.origin_set.All.attributes.collection_id);


                     if ($('#hide-zeros')[0].checked) {
                         addSliders('quantitative', false, true,'');
                         addSliders('tcga_clinical',false, true,'tcga_clinical.');
                     }


                    //changeAjax(false);
                    $('.spinner').hide();
                    deferred.resolve();
                },
                error: function(data){
                    console.log('error loading data');
                }

            });
            return deferred.promise();
        };


        var manageUpdateFromPlot = function(plotId, label){
            var listId = plotId.replace('_chart','_list');
            var filterId = plotId.replace('_chart','');

            var isSlider = $('#'+filterId).hasClass('hasSlider') ? true : false;
            if (isSlider) {
                var maxx = Math.ceil(parseInt(maxx=$('#' + filterId).attr('data-max')));
                var minx= Math.floor(parseInt($('#' + filterId).attr('data-min')));

                var parStr = $('#'+filterId).find('#'+filterId+'_slide').data('attr-par');

                if ((label ==='None') && $('#'+filterId).hasClass('wNone')){
                    butElem = $('#'+filterId).find('.noneBut').children('input')[0];
                    butElem.checked=true
                    setSlider(slideDiv, filterId+"_slide", minx, maxx, true, false);
                    window.addNone(butElem,parStr,true);
                }
                else {
                    if ($('#'+filterId).hasClass('wNone')){
                        butElem = $('#'+filterId).find('.noneBut').children('input')[0];
                        butElem.checked=false;
                        window.addNone(butElem,parStr,false);
                    }

                    var selArr = label.split(' To ');
                    var strt = parseInt((selArr[0] === '*') ? '0' : selArr[0]);
                    var end = parseInt((selArr[1] === '*') ? maxx : selArr[1]);
                    setSlider(filterId+"_slide", false, strt, end, true,true);
                }
            }
            else {
                var inputList = $('#' + listId).find(':input');
                for (var i = 0; i < inputList.length; i++) {
                    var curLabel = $(inputList[i]).parent().children()[1].innerHTML;
                    if (label === curLabel) {
                        inputList[i].checked = true;
                    } else {
                        inputList[i].checked = false;
                    }

                    if (i < inputList.length - 1) {
                        handleFilterSelectionUpdate(inputList[i], false, false);
                    } else {
                        handleFilterSelectionUpdate(inputList[i], true, true);
                    }
                }
            }
        }

        var plotCategoricalData = function (plotId, lbl, plotData, isPie, showLbl){
            var width = 300;
            var height = 260;
            var shifty = 30;
            var margin = 50;
            var radius = Math.min(width, height) / 2 - margin;
            var radiusB = 1.2*radius;
            var mx =0;
            var mn =0;

            var filterId=plotId.replace("_chart","");
            if ( $('#'+filterId).attr('max') ) {
                //var mn = $('#' + slideId).data('min');
                var mx = $('#' + filterId).attr('max');
            }

            // append the svg object to the div called 'my_dataviz'
            var svg = d3.select("#"+plotId)
             .select("svg")
             .attr("width", width)
             .attr("height", height).style("text-anchor","middle");

            svg.selectAll("*").remove();

            titlePart = svg.append("text").attr("text-anchor","middle").attr("font-size", "14px").attr("fill","#2A537A");
            var title0="";
            var title1="";
            var title2="";

            if (lbl.includes('Quarter')){
                var titA = lbl.split('Quarter');
                title1=titA[0]+' Quarter';
                title2=titA[1];
            } else if(lbl.includes('Background')){
                var titA = lbl.split('Activity');
                var titB = titA[1].split('(');
                title0 = titA[0];
                title1= 'Activity '+titB[0];
                title2= '('+titB[1];
            } else if(lbl.includes('(')){
               var titA = lbl.split('(');
               title1=titA[0];
               title2='('+titA[1];
             } else {
              title2=lbl;
             }

            titlePart.append("tspan").attr("x",140).attr("y",15).attr("dx",0).attr("dy",0).text(title0);
            titlePart.append("tspan").attr("x", 140).attr("y", 15).attr("dx", 0).attr("dy", 20).text(title1);
            titlePart.append("tspan").attr("x", 140).attr("y", 15).attr("dx", 0).attr("dy", 40).text(title2);

            var pieg=svg.append("g").attr("transform", "translate(" + width / 2 + "," + (height / 2 + shifty) + ")");
            var data = new Object;
            var nonZeroLabels= new Array();
            //spcing = 1.0/parseFloat(plotData.dataCnt.length);
            var tot=0;

            for (i=0;i<plotData.dataCnt.length;i++) {
               var pkey = plotData.dataLabel[i];
               var cnt = plotData.dataCnt[i];
               data[pkey]=cnt;
               tot+=cnt;
               if (cnt>0){
                   nonZeroLabels.push(pkey);
               }
               //rng.push(parseFloat(i)*parseFloat(spcing));
             }
             $('#'+plotId).data('total',tot.toString());

           // set the color scale
           var color = d3.scaleOrdinal()
           .domain(nonZeroLabels)
           .range(d3.schemeCategory10);

           // don't color last pie slice the same as first
           var colorPie = function(lbl){
             var col="";
               if ( (nonZeroLabels.length>1) & (lbl === nonZeroLabels[nonZeroLabels.length-1]) && (color(nonZeroLabels[0])===color(lbl))  ){
                        col=color(nonZeroLabels[5]);
               } else {
                   col=color(lbl);
               }
               return col;
           }

           // Compute the position of each group on the pie:
          var pie = d3.pie().value(function(d) {return d.value; }).sort(null);
          var data_ready = pie(d3.entries(data));

         // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
          pieg
          .selectAll('whatever')
          .data(data_ready)
          .enter()
          .append('path')
          .attr('d', d3.arc()
          .innerRadius(0)
          .outerRadius(radius)
          )
          .attr('fill', function(d){ return(
            colorPie(d.data.key)  )
           })
          .attr("stroke", "black")
          .style("stroke-width", "0px")
          .style("opacity", 0.7)
              .on("mousemove",function(d){
                var tot=parseFloat($('#'+plotId).data('total'));
                var frac = parseInt(parseFloat(d.data.value)/tot*100);
                var i=1;
                var xpos = d3.mouse(this)[0];
                var ypos = d3.mouse(this)[1];
               txtbx.attr("x",xpos);
               txtbx.attr("y",ypos+30);
               txtbx.selectAll('*').attr("x",xpos);
               txtbx.selectAll('*').attr("y",ypos+30);
               tspans=txtbx.node().childNodes;


               tspans[0].textContent = d.data.key.replace('* To',mn.toString()+' To').replace('To *', 'To '+mx.toString());
               tspans[1].textContent = d.data.value;
               tspans[2].textContent = frac.toString()+"%";
               txtbx.attr("opacity",1);

                d3.select(this).attr('d', d3.arc()
               .innerRadius(0)
               .outerRadius(radiusB)
               );

            })
             .on("mouseleave",function(d){
                d3.select(this).attr('d', d3.arc()
               .innerRadius(0)
               .outerRadius(radius)
               );

                txtbx.attr("opacity",0);
             })
            .on("click",function(d){
                if(!is_cohort) {
                    manageUpdateFromPlot(plotId, d.data.key);
                }
            });

        var txtbx=pieg.append("text").attr("x","0px").attr("y","10px").attr('text-anchor','start');
        txtbx.append("tspan").attr("x","0px").attr("y","0px").attr("dy",0);
        txtbx.append("tspan").attr("x","0px").attr("y","0px").attr("dy",20);
        txtbx.append("tspan").attr("x","0px").attr("y","0px").attr("dy",40);
        txtbx.attr("opacity",0);

        if (tot===0) {
            txtbx.attr('text-anchor','middle');
            tspans=txtbx.node().childNodes;
            tspans[0].textContent = "No Data Available";
            txtbx.attr("opacity",1);
        }

        }


        var findFilterCats = function (id, wCheckBox) {
            filterCats = new Array();
            listElems = $('#' + id).find('.list-group-item__body, .collection-list, .list-group-sub-item__body');
            if (wCheckBox){
                listElems = listElems.children('.search-checkbox-list').parent()
            }
            for (i = 0; i < listElems.length; i++) {
                elem = listElems.get(i);
                nm = elem.id;
                filterCats.push(nm);
            }
            return filterCats
        };

        var parseFilterForCounts = function (id) {
            var dataLabel = new Array();
            var dataCnt = new Array();

            listElems = $('#' + id).find('.checkbox')
            for (var i = 0; i < listElems.length; i++) {
                elem = listElems.get(i);
                spans = $(elem).find('span')
                lbl = spans.get(0).innerHTML;
                cnt = parseInt(spans.get(1).innerHTML);
                dataLabel.push(lbl);
                if ($(spans.get(1)).hasClass("plotit")) {
                    dataCnt.push(cnt);
                } else {
                    dataCnt.push(0);
                }
            }
            return {'dataLabel': dataLabel, 'dataCnt': dataCnt}
        }

        window.updatePlots = function (selectElem) {
            createPlots('search_orig_set');
            createPlots('search_derived_set');
            createPlots('search_related_set');
        }

        var createPlots = function (id) {

            var isPie = true;
            var ptIndx = document.getElementById("plot_type").selectedIndex;
            if (ptIndx === 1) {
                isPie = false;
            }
            var showLbl = document.getElementById("plot_label").checked

            var filterCats = findFilterCats(id,true);
            for (var i = 0; i < filterCats.length; i++) {
                filterCat = filterCats[i];
                filterData = parseFilterForCounts(filterCat);
                plotId = filterCat + "_chart";
                var lbl='';
                lbl = $('#' + filterCat + '_heading').children('a').children('.attDisp')[0].innerText;
                plotCategoricalData(plotId, lbl, filterData, isPie, showLbl);
            }
        }

        window.resort = function(filterCat){
            updateFilters(filterCat,{},false);
        }

        var updateAttributeValues = function(attributeValList, dic){
            var allValues = attributeValList.children('li').children().children('input:checkbox');
            for (var i = 0; i < allValues.length; i++) {
                var elem = allValues.get(i);
                var val = $(elem)[0].value;
                var spans = $(elem).parent().find('span');
                var cntUf=0;
                if (dic.hasOwnProperty('unfilt') && dic['unfilt'].hasOwnProperty(val)) {
                    cntUf = dic['unfilt'][val].count
                }
                else {
                    cntUf = 0;
                }

                spans.filter('.case_count')[0].innerHTML = cntUf.toString();
                if (spans.filter('.plot_count').length>0) {
                    var cntF = 0
                    if (dic.hasOwnProperty('filt') && dic['filt'].hasOwnProperty(val)) {
                        cntF = dic['filt'][val].count
                    } else {
                        cntF = 0;
                    }

                    spans.filter('.plot_count')[0].innerHTML = cntF.toString();
                }
            }
        }

        window.updateFilters = function (filterCat, dic, dataFetched) {
            var numAttrAvail = 0;
            var numCnts=0;

            var headerCnt = $('#'+filterCat).filter('.collection_name').siblings().filter('.case_count');
            if (headerCnt.length>0){
                numCnts = headerCnt[0].innerHTML;
            }

            var showZeros = true;
            var searchDomain = $('#'+filterCat).closest('.search-configuration, .search-scope');
            //var isSearchConf = ($('#'+filterCat).closest('.search-configuration').find('#hide-zeros').length>0);
            if ((searchDomain.find('#hide-zeros').length>0) && (searchDomain.find('#hide-zeros').prop('checked'))){
                showZeros = false;
            }
            var textFilt=false;
            var textFiltVal='';
            if ($('#'+filterCat).children('.text-filter').length>0){
                textFiltVal = $('#'+filterCat).children('.text-filter')[0].value;

            }
            else if ($('#'+filterCat).find('.collection_value').length>0){
                textFiltVal = $('#collection_search')[0].value;
            }

            if (!(textFiltVal==='')){
                textFilt=true;
            }

            if (  $('#'+filterCat).hasClass('isQuant') && dataFetched){
                if (dic.hasOwnProperty('unfilt') && dic['filt'].hasOwnProperty('min_max') ){
                    if (dic['unfilt']['min_max'].hasOwnProperty('min')) {
                        $('#' + filterCat).attr('data-curmin', dic['unfilt']['min_max']['min']);
                    } else {
                        $('#'+filterCat).attr('data-curmin','NA');
                    }
                    if (dic['unfilt']['min_max'].hasOwnProperty('max')) {
                        $('#' + filterCat).attr('data-curmax', dic['unfilt']['min_max']['max']);
                    } else {
                        $('#'+filterCat).attr('data-curmax','NA');
                    }
                } else{
                    $('#'+filterCat).attr('data-curmin','NA');
                    $('#'+filterCat).attr('data-curmax','NA');
                }
             }
            var filterList=$('#'+filterCat).children('ul');
            if (dataFetched){
                updateAttributeValues(filterList, dic);
            }

            var sorter= $('#'+filterCat).children('.sorter').find(":radio").filter(':checked');
            if (sorter.length>0){
                 if (sorter.val()==="alpha"){
                     filterList.children('li').sort(
                        function (a,b){
                        return (  $(b).children().children('.value').text() < $(a).children().children('.value').text() ? 1: -1)
                        }).appendTo(filterList);
                 }
                 else if (sorter.val()==="num"){
                     filterList.children('li').sort(
                        function (a,b){
                        return (  parseFloat($(a).children().children('.case_count').text()) < parseFloat($(b).children().children('.case_count').text()) ? 1: -1)
                        }).appendTo(filterList);
                 }
            }

            var allFilters = filterList.children('li').children().children('input:checkbox');

            var hasFilters=true;
            if (allFilters.length===0){
                hasFilters = false;
            }
            var checkedFilters=allFilters.children('li').children().children('input:checked');
            var showExtras = false;
            if ( ($('#' + filterCat).children('.more-checks').length>0) && $('#' + filterCat).children('.more-checks').hasClass("notDisp")) {
                showExtras = true;
            }
            //var allUnchecked = ((checkedFilters.length == 0) ? true : false)

            var numNonZero = 0;
            numCnts = 0;
            for (var i = 0; i < allFilters.length; i++) {

                var elem = allFilters.get(i);
                var val = $(elem).data('filterDisplayVal');
                var filtByVal = false;

                if ($(elem).siblings().filter('a').length===0) {
                    if (textFilt && !(val.toLowerCase().includes(textFiltVal.toLowerCase()))) {
                        filtByVal = true;
                        $(elem).parent().parent().addClass('filtByVal');
                    } else {
                        $(elem).parent().parent().removeClass('filtByVal');
                    }
                }
                var checked = $(elem).prop('checked');
                var spans = $(elem).parent().find('span');
                //var lbl = spans.get(0).innerHTML;
                var cntUf = parseInt(spans.filter('.case_count')[0].innerHTML);


                var isZero
                if ( (cntUf>0) || checked)  {
                    if (cntUf>0){
                        numNonZero++;
                    }
                    $(elem).parent().parent().removeClass('zeroed');
                    isZero=false;
                } else {
                    $(elem).parent().parent().addClass('zeroed');
                    isZero=true;
                }
                var allChildrenHidden = false;
                if ( $(elem).parent().siblings().filter('.list-group-sub-item__body').length>0 ){
                    if ($(elem).parent().siblings().filter('.list-group-sub-item__body').find('.checkbox').not('.notDisp').length===0){
                        allChildrenHidden = true;
                    }
                }
                var thisAttrAvail = (( ( !isZero || showZeros) && !filtByVal  && !allChildrenHidden) || checked) ? true:false;
                if  ( thisAttrAvail){
                      numAttrAvail++;
                      numCnts+=cntUf;
                }

                if ( (numAttrAvail>5) && thisAttrAvail  ) {
                    $(elem).parent().parent().addClass('extra-values');
                } else {
                    $(elem).parent().parent().removeClass('extra-values');
                }

                if ( thisAttrAvail && (showExtras || (numAttrAvail<6)) ) {
                      $(elem).parent().parent().removeClass('notDisp');
                } else {
                    $(elem).parent().parent().addClass('notDisp');
                }

            }

            if (hasFilters){
                if (numNonZero===0){
                    $('#' + filterCat+'_heading').children('a').children().addClass('greyText');
                    $('#' + filterCat+'_heading').children('a').children('.noCase').removeClass('notDisp');

                } else {
                    $('#' + filterCat+'_heading').children('a').children().removeClass('greyText');
                    $('#' + filterCat+'_heading').children('a').children('.noCase').addClass('notDisp');
                }

                var numMore = filterList.children('li').filter('.extra-values').length;
                if ($('#' + filterCat).children('.more-checks').children('.show-more').length>0){
                    $('#' + filterCat).children('.more-checks').children('.show-more')[0].innerText = "show " + numMore.toString() + " more";
                    if (numMore>0){
                            $('#' + filterCat).children('.more-checks').children('.show-more').removeClass('notDisp');
                            $('#' + filterCat).children('.less-checks').children('.show-less').removeClass('notDisp');
                        } else{
                            $('#' + filterCat).children('.more-checks').children('.show-more').addClass('notDisp');
                            $('#' + filterCat).children('.less-checks').children('.show-less').addClass('notDisp');
                        }
                }

                if ( numAttrAvail < 1)  {
                    $('#' + filterCat).children('.more-checks').hide();
                    $('#' + filterCat).children('.less-checks').hide();
                    $('#' + filterCat).children('.check-uncheck').hide();

                } else if (showExtras) {
                    $('#' + filterCat).children('.more-checks').hide();
                    $('#' + filterCat).children('.less-checks').show();
                    $('#' + filterCat).children('.check-uncheck').show();
                } else {

                    $('#' + filterCat).children('.more-checks').show();
                    $('#' + filterCat).children('.check-uncheck').show();
                    if ($('#' + filterCat).children('.more-checks').children('.show-more').length>0){

                    }
                    $('#' + filterCat).children('.less-checks').hide();
                }
            }
            return [numAttrAvail, numCnts];
        }

        setAllFilterElements = function(hideEmpty,filtSet){
            //var filtSet = ["search_orig_set","segmentation","quantitative","qualitative","tcga_clinical"];
            for (var i=0;i<filtSet.length;i++) {
                filterCats = findFilterCats(filtSet[i], false);
                var resetParentVal=false;
                progInd = filterCats.indexOf('Program');
                if (progInd>-1){
                    filterCats.splice(progInd,1);
                    filterCats.push('Program');
                    resetParentVal=true;
                }


                for (var j = 0; j < filterCats.length; j++) {
                        var ret = updateFilters(filterCats[j],{},false);
                        if (resetParentVal && !(filterCats[j]==='Program')){
                            parentVal=$('#'+filterCats[j]).siblings().filter('.list-group-item__heading').find('.case_count');
                            parentVal[0].innerHTML=ret[1];
                            if (ret[0]===0){
                                $('#'+filterCats[j]).addClass('notDisp')
                            }
                        }
                }
            }
            addSliders('quantitative', false, hideEmpty,'');
            addSliders('tcga_clinical',false, hideEmpty,'tcga_clinical.');
        }

        window.updateColl = function(){
            var filtSet=['program_set']
            var checked=$('#Program').find('.hide-zeros')[0].checked;
            setAllFilterElements(checked,filtSet);
        }

        window.hideAtt = function(hideElem){
            var filtSet = ["search_orig_set","segmentation","quantitative","qualitative","tcga_clinical"];
            setAllFilterElements(hideElem.checked, filtSet);
        }

        var updateFilterSelections = function (id, dicofdic) {
            filterCats = findFilterCats(id,false);
            for (i = 0; i < filterCats.length; i++) {
                cat = filterCats[i]
                filtDic={'unfilt':'', 'filt':''}

                if ( (dicofdic.hasOwnProperty('unfilt')) &&  (dicofdic['unfilt'].hasOwnProperty(cat)))
                {
                    filtDic['unfilt']=dicofdic['unfilt'][cat]
                }
                if ( (dicofdic.hasOwnProperty('filt')) && (dicofdic['filt'].hasOwnProperty(cat))  )
                {
                    filtDic['filt']=dicofdic['filt'][cat]
                }
                updateFilters(filterCats[i], filtDic, true);
            }
        };


        var checkFilters = function(filterElem) {
            var checked = $(filterElem).prop('checked');
            var neighbours =$(filterElem).parentsUntil('.list-group-item__body, .list-group-sub-item__body','ul').children().children().children('input:checkbox');
            var neighboursCk = $(filterElem).parentsUntil('.list-group-item__body, .list-group-sub-item__body','ul').children().children().children(':checked');
            var allChecked= false;
            var noneChecked = false;
            if (neighboursCk.length===0){
                noneChecked = true;
            }

            if (neighbours.length === neighboursCk.length){
                allChecked = true;
            }

            var filterCats= $(filterElem).parentsUntil('.tab-pane','.list-group-item, .checkbox');
            var j = 1;

            var curCat='';
            var lastCat='';
            numCheckBoxes=0;
            for (var i=0;i<filterCats.length;i++){
                var filtnm='';
                ind = filterCats.length-1-i;
                filterCat=filterCats[ind];
                hasCheckBox=false;
                if (filterCat.classList.contains('checkbox')){
                     checkBox =$(filterCat).find('input:checkbox')[0];
                     filtnm=checkBox.value;
                     hasCheckBox = true;
                     numCheckBoxes++;
                } else {

                    var filtnmSrc=$(filterCat).children('.list-group-sub-item__body, .list-group-item__body, .collection-list')
                    if (filtnmSrc.length<1){
                        filtnmSrc=$(filterCat).children().children('.collection_id')
                    }
                    var filtnm = filtnmSrc[0].id;
                    if  ($(filterCat).children('.list-group-item__heading').children('input:checkbox').length>0) {
                       hasCheckBox = true;
                       numCheckBoxes++;
                    }
                   checkBox = $(filterCat).children('.list-group-item__heading').children('input:checkbox')[0];
                }

                if ( hasCheckBox && (ind ===1) && !(allChecked) && !(noneChecked)){
                    checkBox.indeterminate = true;
                    checkBox.checked = false;
                } else if (hasCheckBox){
                    checkBox.indeterminate = false;
                }

                if ((checked) && (curCat.length>0) && hasCheckBox  ){
                    if (!(checkBox.indeterminate)) {
                        checkBox.checked = true;
                    }
                    if (!(filterObj.hasOwnProperty(curCat))){
                        filterObj[curCat] = new Array();
                    }
                    if (filterObj[curCat].indexOf(filtnm)<0){
                        filterObj[curCat].push(filtnm)
                    }

                }

                if (!checked && ( (ind===0) || ( (ind===1) && hasCheckBox && noneChecked)) ){
                   checkBox.checked = false;
                   //checkBox.indeterminate =  false;
                   if ( filterObj.hasOwnProperty(curCat) && (filterObj[curCat].indexOf(filtnm)>-1) ){
                        pos = filterObj[curCat].indexOf(filtnm);
                        filterObj[curCat].splice(pos,1);
                        if (Object.keys(filterObj[curCat]).length===0){
                             delete filterObj[curCat];
                        }
                   }

                   if (curCat.length>0){
                     curCat+="."
                     }
                    lastCat = curCat;
                    curCat+=filtnm;
                    if ($(filterElem).parent().hasClass('list-group-item__heading')){
                          chkList=$(filterElem).parent().siblings().filter('.list-group-item__body').find('input:checkbox');
                          for (var ind=0; ind<chkList.length;ind++){
                              chkList[ind].checked=false;
                          }
                    }
                    for (var ckey in filterObj){
                        if (ckey.startsWith(curCat)){
                           delete filterObj[curCat];
                       }
                   }
                }
                if (curCat.length>0){
                    curCat+="."
                }
                curCat+=filtnm;
            }

            var childBoxes=$(filterElem).parent().siblings().find('input:checkbox');
            if (checked && (childBoxes.length>0)) {
                filterObj[curCat] = new Array();
                childBoxes.each(function(){
                   this.checked=true;
                   filterObj[curCat].push(this.value);
                });
            } else {
                delete filterObj[curCat];
                $(childBoxes).prop('checked',false);
            }
        };

        var handleFilterSelectionUpdate = function(filterElem, mkFilt, doUpdate) {
            checkFilters(filterElem);
            if (mkFilt) {
                mkFiltText();
            }
            if (doUpdate){
                updateFacetsData(true);
            }
        };

        var sortTable = function (tbl, curInd, asc) {
            var thd = $(tbl).find('thead').find('th')[curInd];
            var isSeries = ( ($(tbl).find('tbody')[0].id === 'series_table') ? true : false);
            rowSet = $(tbl).find('tbody').children();
            rowSet = rowSet.sort(function (a, b) {

                item1 = $(a).children()[curInd].innerText;
                item2 = $(b).children()[curInd].innerText;
                if (thd.classList.contains('numeric_data')) {
                    item1 = parseFloat(item1);
                    item2 = parseFloat(item2);
                }

                if (item1 ===item2){
                    if ( isSeries && (curInd===0)){
                        var seriesNuma = parseInt( $(a).children()[1].innerText  );
                        var seriesNumb = parseInt( $(b).children()[1].innerText  );
                        if (seriesNuma === seriesNumb){
                            return 0;
                        } else if (((seriesNuma > seriesNumb) )){
                            return 1;
                        } else {
                            return -1;
                        }
                    } else {
                       return 0;
                    }
                } else if (((item1 > item2) && asc) || ((item2 > item1) && !asc)) {
                    return 1;
                } else {
                    return -1
                }
            });
            $(tbl).find('tbody').append(rowSet);
        };

        var filterItemBindings = function (filterId) {
            /*
            In progress - text input to search for attribute values
            $('#' + filterId).find('.text-filter').on("keyup",function(){
                var value = $(this).val().toLowerCase();
                collections=$(this).parent().parent().children('ul').children('.list-group_item').each(function() {
                    list_val=$(this).children('.list-group-item__heading').data('filter-display-val');
                    if (list_val.indexOf(value)>-1){
                       $(this).removeClass('filtText');
                    }
                    else{
                        $(this).addClass('filtText');
                    }
                });

            }) */

            /*$('#' + filterId).find('.text-filter').on('keypress', function() {
                 //alert('hi');
                 updateFilters(filterId,{},false);
                 //handleFilterSelectionUpdate(this, false, false);

            }); */

            $('#' + filterId).find('input:checkbox').not('#hide-zeros').on('click', function () {
                handleFilterSelectionUpdate(this, true, true);
            });

            $('#' + filterId).find('.show-more').on('click', function () {
                $(this).parent().parent().children('.less-checks').show();
                $(this).parent().parent().children('.less-checks').removeClass('notDisp');
                $(this).parent().parent().children('.more-checks').addClass('notDisp');

                $(this).parent().hide();
                var extras = $(this).parent().parent().children('.search-checkbox-list').children('.extra-values')

                if ( ($('#'+filterId).closest('.search-configuration').find('#hide-zeros').length>0)  && ($('#'+filterId).closest('.search-configuration').find('#hide-zeros').prop('checked'))){
                    extras=extras.not('.zeroed');
                }
                extras.removeClass('notDisp');
            });

            $('#' + filterId).find('.show-less').on('click', function () {
                $(this).parent().parent().children('.more-checks').show();
                $(this).parent().parent().children('.more-checks').removeClass('notDisp');
                $(this).parent().parent().children('.less-checks').addClass('notDisp');

                $(this).parent().hide();
                $(this).parent().parent().children('.search-checkbox-list').children('.extra-values').addClass('notDisp');
            });

            $('#' + filterId).find('.check-all').on('click', function () {
                if (!is_cohort) {
                    //$('#' + filterId).find('.checkbox').find('input').prop('checked', true);
                    var filterElems = new Object();
                    filterElems = $(this).parentsUntil('.list-group-item, #program_set').filter('.list-group-item__body, .list-group-sub-item__body, #Program').children('ul').children();
                    for (var ind = 0; ind < filterElems.length; ind++) {
                        var ckElem = new Object();
                        if ($(filterElems[ind]).children().filter('.list-group-item__heading').length > 0) {
                            ckElem = $(filterElems[ind]).children().filter('.list-group-item__heading').children().filter('input:checkbox')[0];
                        } else {
                            ckElem = $(filterElems[ind]).children().filter('label').children().filter('input:checkbox')[0];
                        }
                        ckElem.checked = true;
                        //$(filterElem).prop('checked') = true;
                        if (ind < filterElems.length - 1) {
                            handleFilterSelectionUpdate(ckElem, false, false);
                        } else {
                            handleFilterSelectionUpdate(ckElem, true, true);
                        }
                    }
                }
            });

            $('#' + filterId).find('.uncheck-all').on('click', function () {
              if (!is_cohort){
                    //$('#' + filterId).find('.checkbox').find('input').prop('checked', true);
                    var filterElems = new Object();
                    filterElems = $(this).parentsUntil('.list-group-item, #program_set').filter('.list-group-item__body, .list-group-sub-item__body, #Program').children('ul').children();
                    for (var ind = 0; ind < filterElems.length; ind++) {
                        var ckElem = new Object();
                        if ($(filterElems[ind]).children().filter('.list-group-item__heading').length > 0) {
                            ckElem = $(filterElems[ind]).children().filter('.list-group-item__heading').children().filter('input:checkbox')[0];
                        } else {
                            ckElem = $(filterElems[ind]).children().filter('label').children().filter('input:checkbox')[0];
                        }

                        ckElem.checked = false;
                        if (ind < filterElems.length - 1) {
                            handleFilterSelectionUpdate(ckElem, false, false);
                        } else {
                            handleFilterSelectionUpdate(ckElem, true, true);
                        }
                   }
              }
            });
        };

        var clearFilter = function (filterElem) {
            if (filterElem.classList.contains('all')){
                    for (cat in window.filterObj){
                        delete window.filterObj[cat];
                    }
                    //window.filterObj.collection_id = window.tcgaColls;
                }
            if (filterElem.classList.contains('all')){

            }
        };

     var addFilterBindings = function(id){
         var filterCats = findFilterCats(id,false);
         for (var i=0;i<filterCats.length;i++){
             filterItemBindings(filterCats[i]);
        }
     };

    var addSliders = function(id,initialized,hideZeros, parStr){
        $('#'+id).find('.list-group-item__body.isQuant').each(function() {
            $(this).find('.more-checks').addClass('hide');
            $(this).find('.less-checks').addClass('hide');
            $(this).find('.sorter').addClass('hide');
            //var min = Math.ceil($(this).data('min') * 1000)/1000;
            //var min = Math.floor($(this).data('min'));

            var min = Math.floor(parseInt($(this).attr('data-min')));
            var max = Math.ceil(parseInt($(this).attr('data-max')));
            var lower = parseInt($(this).attr('data-curminrng'));
            var upper = parseInt($(this).attr('data-curmaxrng'));
            var addSlider = true;
            var isActive = $(this).hasClass('isActive');
            var wNone = $(this).hasClass('wNone');
            var checked = ($(this).find('.noneBut').length>0) ? $(this).find('.noneBut').find(':input')[0].checked : false;

            if (!initialized) {
                var slideDivId = $(this).prop('id') + '_slide';
                curmin = $(this).attr('data-curmin');
                curmax = $(this).attr('data-curmax');

                $(this).find('#' + slideDivId).remove();
                $(this).find('.reset').remove();

                $(this).find('.noneBut').remove();
                var inpName = $(this).prop('id') + '_input';
                $(this).find('#'+inpName).remove();

                if (hideZeros) {
                    if ( ( (curmin === 'NA') || (curmax === 'NA')) && !isActive ){
                        addSlider = false;
                        $(this).removeClass('hasSlider');
                        //$(this).removeClass('isActive');
                    } else if (isActive){
                        if (curmin === 'NA') {
                                min = lower;
                        } else {
                            min = Math.min(lower, Math.floor(curmin));
                        }
                        if (curmax === 'NA'){
                                max = upper;
                        } else {
                            max = Math.max(upper, Math.ceil(curmax));
                        }
                    } else {
                            min = Math.floor(curmin);
                            max = Math.ceil(curmax);
                            lower=min;
                            upper=max;
                            //$(this).attr('data-curminrng', lower);
                            //$(this).attr('data-curmaxrng', upper);
                    }
                } else if (!isActive){
                    lower=min;
                    upper=max;
                    //$(this).attr('data-curminrng', lower);
                    //$(this).attr('data-curmaxrng', upper);
                }
            }

            if (addSlider) {
                $(this).addClass('hasSlider');
                mkSlider($(this).prop('id'), min, max, 1, true, wNone, parStr, $(this).data('filter-attr-id'), $(this).data('filter-display-attr'), lower, upper, isActive,checked);
            } else{
                $(this).removeClass('hasSlider');

            }
        });
     };

     var load_filters = function(filters) {
         var sliders = [];
        _.each(filters, function(group){
            _.each(group['filters'], function(filter) {
                let selector = 'div.list-group-item__body[data-filter-attr-id="' +
                    filter['id'] + '"], ' + 'div.list-group-sub-item__body[data-filter-attr-id="' +
                    filter['id'] + '"]';
                $(selector).parents('.collection-list').collapse('show');

                $(selector).each(function(index, selEle)
                {
                    /*if ($(selEle).find('ul, .ui-slider').length>0) {
                        $(selEle).collapse('show');
                        $(selEle).find('.show-more').triggerHandler('click');
                        $(selEle).parents('.tab-pane.search-set').length > 0 && $('a[href="#' + $(selector).parents('.tab-pane.search-set')[0].id + '"]').tab('show');
                    }*/
                    var attValueFoundInside= false;
                    if ($(selEle).children('.ui-slider').length > 0) {
                        attValueFoundInside= true;
                        var pushSliders = false;
                        var left =0;
                        var right=0;
                        if (filter['values'].indexOf('None')>-1)
                        {
                            var ckbx=$(selEle).find('.noneBut').children('input:checkbox')[0];
                            ckbx.checked=true;
                            var parStr=$(selEle).children('.ui-slider').data('attr-par');
                            addNone(ckbx, parStr, false);
                            if (filter['values'].length>1){
                                pushSliders=true;
                                var ind = (filter['values'].indexOf('None')+1)%2
                                var vals=JSON.parse(filter['values'][ind]);
                                left_val=vals[0];
                                right_val=vals[1];
                            }
                        }
                        else {
                            pushSliders=true;
                            left_val=filter['values'][0].indexOf(".") >= 0 ? parseFloat(filter['values'][0]) : parseInt(filter['values'][0]);
                            right_val=filter['values'][1].indexOf(".") >= 0 ? parseFloat(filter['values'][1]) : parseInt(filter['values'][1]);
                        }

                        if (pushSliders) {
                            sliders.push({
                                'id': $('div.list-group-item__body[data-filter-attr-id="' + filter['id'] + '"]').children('.ui-slider')[0].id,
                                'left_val': left_val,
                                'right_val': right_val,
                            })
                        }
                     } else {
                       _.each(filter['values'], function (val) {
                           if ($(selEle).find('input[data-filter-attr-id="' + filter['id'] + '"][value="' + val + '"]').length>0) {
                               attValueFoundInside = true;
                           }
                           $('input[data-filter-attr-id="' + filter['id'] + '"][value="' + val + '"]').prop("checked", true);
                           checkFilters($('input[data-filter-attr-id="' + filter['id'] + '"][value="' + val + '"]'));

                      });
                  }
                    if (attValueFoundInside){
                        $(selEle).collapse('show');
                        $(selEle).find('.show-more').triggerHandler('click');
                        $(selEle).parents('.tab-pane.search-set').length > 0 && $('a[href="#' + $(selector).parents('.tab-pane.search-set')[0].id + '"]').tab('show');
                    }

               });
            });
        });
        if(sliders.length > 0) {
            load_sliders(sliders, false);
        }
        mkFiltText();
        return updateFacetsData(true).promise();
     };

     var load_sliders = function(sliders, do_update) {
        _.each(sliders, function(slider) {
            var slider_id = slider['id'];
            setSlider(slider_id, false, slider['left_val'], slider['right_val'], true, false);
            //updatePlotBinsForSliders(slider_id);
        });

        if (do_update) {
            mkFiltText();
            updateFacetsData(true).promise();
        }
     };

    var ANONYMOUS_FILTERS = {};
    var ANONYMOUS_SLIDERS = {};

    var save_anonymous_selection_data = function() {
        var groups = [];

        // Get all checked filters
        var filters = [];

        // For collection list
        $('.collection-list').each(function() {
            var $group = $(this);
            var checkboxes = $group.find("input:checked").not(".hide-zeros").not(".sort_val");
            if (checkboxes.length > 0) {
                var values = [];
                var my_id = "";
                checkboxes.each(function() {
                    var $checkbox = $(this);
                    var my_value = $checkbox[0].value;
                    my_id = $checkbox.data('filter-attr-id');
                    values.push(my_value);
                });
                filters.push({
                    'id': my_id,
                    'values': values,
                });
            }
        });

        // For other list item groups
        $('.list-group-item__body').each(function() {
            var $group = $(this);
            var my_id = $group.data('filter-attr-id');
            if (my_id != null)
            {
                var checkboxes = $group.find("input:checked").not(".hide-zeros").not(".sort_val");
                if (checkboxes.length > 0)
                {
                    var values = [];
                    checkboxes.each(function() {
                        var $checkbox = $(this);
                        var my_value = $checkbox[0].value;
                        values.push(my_value);
                    });
                    filters.push({
                        'id': my_id,
                        'values': values,
                    });
                }
            }
        });

        groups.push({'filters': filters});
        var filterStr = JSON.stringify(groups);
        sessionStorage.setItem('anonymous_filters', filterStr);

        // Get all sliders with not default value
        var sliders = [];
        $('.ui-slider').each(function() {
            var $this = $(this);
            var slider_id = $this[0].id;
            var left_val = $this.slider("values", 0);
            var right_val = $this.slider("values", 1);
            var min = $this.slider("option", "min");
            var max = $this.slider("option", "max");
            if (left_val !== min || right_val !== max) {
                sliders.push({
                   'id': slider_id,
                    'left_val': left_val,
                    'right_val': right_val,
                });
            }
        });
        var sliderStr = JSON.stringify(sliders);
        sessionStorage.setItem('anonymous_sliders', sliderStr);
    };

    var load_anonymous_selection_data = function() {
        // Load anonymous filters from session storage and clear it, so it is not always there
        var filter_str = sessionStorage.getItem('anonymous_filters');
        ANONYMOUS_FILTERS = JSON.parse(filter_str);
        sessionStorage.removeItem('anonymous_filters');

        var slider_str = sessionStorage.getItem('anonymous_sliders');
        ANONYMOUS_SLIDERS = JSON.parse(slider_str);
        sessionStorage.removeItem('anonymous_sliders');
    };

    $('#save-cohort-btn').on('click', function() {
        if(!user_is_auth) {
            save_anonymous_selection_data();
            location.href=$(this).data('uri');
        }
    });

    $('#sign-in-dropdown').on('click', function() {
        save_anonymous_selection_data();
    });

     cohort_loaded = false;
     function load_preset_filters() {
         if (is_cohort && !cohort_loaded) {
             $('.spinner').show();
             var loadPending = load_filters(cohort_filters);
             loadPending.done(function () {
                 $('.spinner').show();
                 console.debug("Load pending complete.");
                 cohort_loaded = true;
                 $('input[type="checkbox"]').prop("disabled", "disabled");
                 $('#projects_table').find('input:checkbox').removeAttr("disabled");
                 //$('.check-all').prop("disabled","disabled");
                 // Re-enable checkboxes for export manifest dialog, unless not using social login
                 if (user_is_social)
                 {
                     $('.field-checkbox').removeAttr('disabled');
                     $('.column-checkbox').removeAttr('disabled');
                 }
                 $('#include-header-checkbox').removeAttr('disabled');

                 $('input#hide-zeros').prop("disabled", "");
                 $('input#hide-zeros').prop("checked", true);
                 $('input#hide-zeros').each(function(){$(this).triggerHandler('change')});
                 $('div.ui-slider').siblings('button').prop("disabled", true);
                 $('.noneBut').find('input:checkbox').prop("disabled",true);
                 $('.spinner').hide();
             });
         } else if (Object.keys(filters_for_load).length > 0) {
             var loadPending = load_filters(filters_for_load);
             loadPending.done(function () {
                 //console.debug("External filter load done.");
             });
         } else {
             // check for localStorage key of saved filters from a login
             load_anonymous_selection_data();
             var has_sliders = (ANONYMOUS_SLIDERS !== null && ANONYMOUS_SLIDERS.length > 0);
             var has_filters = (ANONYMOUS_FILTERS !== null && ANONYMOUS_FILTERS[0]['filters'].length > 0);
             if (has_sliders) {
                 let loadPending = load_sliders(ANONYMOUS_SLIDERS, !has_filters);
                 if (has_filters) {
                     //console.debug("Sliders loaded from anonymous login.");
                 } else {
                    loadPending.done(function () {
                     //console.debug("Sliders loaded from anonymous login.");
                    });
                 }
             }
             if (has_filters) {
                 let loadPending = load_filters(ANONYMOUS_FILTERS);
                 loadPending.done(function () {
                     console.debug("Filters loaded from anonymous login.");
                 });
             }
         }
     }



     const myObserver = new ResizeObserver(entries => {
         entries.forEach(entry => {
             htr = $('.vert').height();
             htsrch = $('.search-scope').height();
             ht = Math.max(2000,htr-htsrch+100);
             $('.search-con').css('max-height',ht+'px');
       });
     });
     myObserver.observe($('#rh_panel')[0])
     myObserver.observe($('.search-scope')[0])

      $(document).ready(function () {
            window.selItems = new Object();
            window.selItems.selStudies = new Object();
            window.selItems.selCases = new Object();
            window.selItems.selProjects = new Array();

            window.casesTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
            window.studyTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};
            window.seriesTableCache = { "data":[], "recordLimit":-1, "datastrt":0, "dataend":0, "req": {"draw":0, "length":0, "start":0, "order":{"column":0, "dir":"asc"} }};

            filterItemBindings('program_set');
            filterItemBindings('search_orig_set');
            filterItemBindings('search_derived_set');
            filterItemBindings('search_related_set');


            max= Math.ceil(parseInt($('#age_at_diagnosis').data('data-max')));
            min= Math.floor(parseInt($('#age_at_diagnosis').data('data-min')));

            $('#SliceThickness').addClass('isQuant');
            $('#SliceThickness').addClass('wNone');
            $('#SliceThickness').find('.text-filter').remove();

            $('#age_at_diagnosis').addClass('isQuant');
            $('#age_at_diagnosis').find('.text-filter').remove();
            $('#age_at_diagnosis').addClass('wNone');

            $('#quantitative').find('.list-group-item__body').each(function() {
                $(this).addClass('isQuant');
                $(this).find('.text-filter').remove();
            });

            addSliders('search_orig_set',true, false,'');
            addSliders('tcga_clinical',true, false,'tcga_clinical.');
            addSliders('quantitative',true, false,'');

            createPlots('search_orig_set');
            createPlots('search_derived_set');
            createPlots('tcga_clinical');

            //var numCol = $('#projects_table').children('tr').length
            //$('#projects_panel').find('.total-file-count')[0].innerHTML = numCol.toString();
            //$('#projects_panel').find('.goto-page-number').data('max','3');
          updateProjectTable(window.collectionData);
           /*


            $('#proj_table').DataTable(
                {
                    "dom":'<"dataTables_controls"ilpf>rt<"bottom"><"clear">',
                    "order": [[ 1, "asc" ]],
                    "data": window.collectionData,
                    "createdRow":function(row,data,dataIndex){
                        $(row).data('projectid',data[1]);
                        $(row).attr('id','project_row_'+data[1]);
                    },
                    "columnDefs":[
                    {className:"ckbx text_data", "targets":[0]},
                    {className:"projects_table_num_cohort", "targets":[3]},
                  ],
                    "columns": [
                        {"type": "html", "orderable": false, render:function(){return '<input type="checkbox" onclick="updateProjectSelection($(this).parent().parent())">'}},
                       {"type": "text", "orderable": true},
                       {"type":"num", orderable:true},
                       {"type":"num", orderable:true, "createdCell":function(td,data,row)
                        {
                            $(td).attr('id','patient_col_'+row[1]);
                            return;
                       }}
                  ]
               }
            );
            //"createdCell":function(td,data,row){$(td).attr("id","patient_col_"+row[1]);}
            $('#proj_table').children('tbody').attr('id','projects_table');
            */
             // .search-configuration .vert
             $('.clear-filters').on('click', function () {
                   $('input:checkbox').not('#hide-zeros').not('.tbl-sel').prop('checked',false);
                   $('input:checkbox').not('#hide-zeros').not('.tbl-sel').prop('indeterminate',false);
                   window.filterObj = new Object();
                   $('.ui-slider').each(function(){
                       setSlider(this.id,true,0,0,true, false);
                   })
                   $('#search_def_warn').hide();

                   mkFiltText();
                   updateFacetsData(true);
             });

            load_preset_filters();
            //$('.spinner').hide();

        }
    );
});
