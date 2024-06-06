/**
 *
 * Copyright 2020, Institute for Systems Biology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

require.config({
    baseUrl: STATIC_FILES_URL+'js/',
    paths: {
        jquery: 'libs/jquery-3.5.1',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        session_security: 'session_security/script',
        underscore: 'libs/underscore-min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        tablesorter:'libs/jquery.tablesorter.min',
        filterutils:'filterutils'



    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'session_security': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'tablesorter': ['jquery'],
        'underscore': {exports: '_'},
        'filterutils':['jquery']


    }
});

// Set up common JS UI actions which span most views
require([
    'filterutils',
    'jquery',
    'jqueryui',
    'bootstrap',
    'session_security',
    'underscore',
    'utils',
    'assetscore',
    'assetsresponsive',
    'tablesorter'
], function(filterutils, $, jqueryui, bootstrap, session_security, _, utils) {


});

// Return an object for consts/methods used by most views
define(['filterutils','jquery', 'utils'], function(filterutils, $, utils) {

    window.resetCart = function(){
        window.cart= new Object();
        window.glblcart = new Object();
        window.cartHist = new Array();

        window.cartStep=1;

        window.partitions= new Array();

        let cartSel = new Object();
        var parsedFiltObj = filterutils.parseFilterObj();;
        cartSel['filter']= parsedFiltObj;
        cartSel['selections']= new Array();
        cartSel['partitions']= new Array();
        window.cartHist.push(cartSel);
        //sesssionStorage.setItem("cartHist",JSON.stringify(window.cartHist));
        window.partitions = new Array();
        window.cartStep=0
        window.cartDetails = 'Current filter definition is '+JSON.stringify(parsedFiltObj)+'\n\n'
        window.cartStep++;

         window.updateTableCounts(1);
         var gtotals = [0,0,0,0];
          $('#cart_stats').addClass('notDisp');
          $('#export-manifest-cart').attr('disabled','disabled');
          $('#view-cart').attr('disabled','disabled');

    }

    $('.cart-modal-button').on('click', function(){
        detsArr = window.cartDetails.split('\n\n');
        var str='<ol type="1" class="nav navbar-nav navbar-left">';
        var ii=0;
        for (var i=0;i<detsArr.length;i++){
            if (detsArr[i].length>0) {
                str = str + '<li class="navbar-link navbar-item cartlist">' + ii.toString() + '. &nbsp;' + detsArr[i] + '</li>'
                 ii++;
            }
        }
        str=str+'</ol>'
        $('#cart_details').html(str);
        /*$('#cart-details-modal').modal('show');
        var height =$('#cart-details-modal').find('.modal-content').outerHeight();
        $('#cart-details-modal').find('.modal-body').height(height);
        $('#cart-details-modal').find('.modal-body').css('overflow-y:auto');*/

        //$('#cart-details-modal').modal('show');
        /* $('#cart-details-modal').addClass('fade');
        $('#cart-details-modal').addClass('in');
        $('#cart-details-modal').css("display","block");*/
        //$('#cart-details-modal').modal('show');
        //$('#cart-details-modal').css("display","block");
        //var width=$('#cart-details-modal').find('.modal-content').outerWidth();
        //var height =$('#cart-details-modal').find('.modal-content').outerHeight();
        //$('#cart-details-modal').css("display","none");

            $('#cart-details-modal').modal('show');
            /*$('#cart-details-modal').height(height);
            $('#cart-details-modal').width(width); */


    })
    /*
    $('#cart-details-modal').on('show.bs.modal', function(){
        detsArr = window.cartDetails.split('\n\n');
        var str='<ul class="nav navbar-nav navbar-left">';
        for (var i=0;i<detsArr.length;i++){
            str =str+'<li class="navbar-link navbar-item">'+detsArr[i]
        }
        str=str+'<ul>'
        $('#cart_details').html(str);
         var width=$('#cart-details-modal').find('.modal-content').outerWidth();
        var height =$('#cart-details-modal').find('.modal-content').outerHeight();
        $('#cart-details-modal').height(height);
            $('#cart-details-modal').width(width);
    });
    $('#cart-details-modal').on('shown.bs.modal', function(){
         $('#collection-modal').css("display","block");
        //var width=$('#cart-details-modal').find('.modal-content').outerWidth();
        var height =$('#cart-details-modal').find('.modal-content').outerHeight();
        $('#cart-details-modal').height(height);
            //$('#cart-details-modal').width(width);
    });
    */
    const updateCartSelections = function(newSel){
        var curInd = window.cartHist.length - 1;
        var selections = window.cartHist[curInd]['selections'];
        var adding = newSel['added'];
        var selection = newSel['sel'];
        var selectionCancelled = false;
        var redundant = false;
        var newHistSel = new Array();
        for (var i=0;i<selections.length;i++) {
            var curselection = selections[i]['sel'];
            var curAdded = selections[i]['added'];

            if (curselection.length >= selection.length) {
                var differenceFound = false;
                for (var j = 0; j < selection.length; j++) {
                    if (!(curselection[j] == selection[j])) {
                        differenceFound = true;
                        break;
                    }
                }
                if (differenceFound){
                    newHistSel.push(selections[i]);
                }

            }
            else{
                newHistSel.push(selections[i]);
            }

        }

        newHistSel.push(newSel);

        window.cartHist[curInd]['selections'] =  newHistSel;
        window.cartHist[curInd]['partitions'] = mkOrderedPartitions(window.cartHist[curInd]['selections']);
    }


    const formcartdata = function(){
        var partitions = new Array();
            for (var i=0; i< window.partitions.length;i++) {
                if (!('null'in window.partitions[i]) || !(window.partitions[i]['null'])){
                    partitions.push(window.partitions[i])
                }
            }
            var filterSets = new Array();
            for (var i=0; i< window.cartHist.length;i++) {
               filterSets.push(window.cartHist[i]['filter'])
            }
        return [partitions, filterSets];
    }

     window.viewcart = function(){
        window.updatePartitionsFromScratch();
        var ret = formcartdata();
        var partitions = ret[0];
        var filterSets = ret[1];
        /*
        var partitions = new Array();
            for (var i=0; i< window.partitions.length;i++) {
                if (!('null'in window.partitions[i]) || !(window.partitions[i]['null'])){
                    partitions.push(window.partitions[i])
                }
            }
            var filterSets = new Array();
            for (var i=0; i< window.cartHist.length;i++) {
               filterSets.push(window.cartHist[i]['filter'])
            }
         */
            if ($('#cart-view-elem').length>0) {
                document.getElementById("cart-view-elem").remove();
            }

            var csrftoken = $.getCookie('csrftoken');
            var form = document.createElement('form');
            form.id = "cart-view-elem";
            form.style.visibility = 'hidden'; // no user interaction is necessary
            form.method = 'POST'; // forms by default use GET query strings
            //form.action = '/explore/cart/';
            form.action = '/cart/';
            //form.append(csrftoken);
            var input = document.createElement('input');
            input.name = "csrfmiddlewaretoken";
            input.value =csrftoken;
            form.appendChild(input);
            var input = document.createElement('input');
            input.name = "filtergrp_list";
            input.value = JSON.stringify(filterSets);
            form.appendChild(input);
            var input = document.createElement('input');
            input.name = "partitions";
            input.value = JSON.stringify(partitions);
            form.appendChild(input);
            document.body.appendChild(form)
            form.submit();

        /* var url = '/cart/';
        url = encodeURI('/cart/');



        ndic = {
            'filtlist': JSON.stringify(filterSets),
            'partitions': JSON.stringify(window.partitions)


        }

        var csrftoken = $.getCookie('csrftoken');
        let deferred = $.Deferred();
        $.ajax({
            url: url,
            data: ndic,
            dataType: 'json',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            beforeSend: function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
            success: function (data) {
                try {
                     var k =1;
                }
                finally {
                    deferred.resolve([]);
                }
            },
            error: function(data){
                alert("There was an error fetching server data. Please alert the systems administrator")
                console.log('error loading data');
            }
        });
        return deferred.promise(); */
    };

      window.updatePartitionsFromScratch =function(){
        window.partitions = new Array();

        for (var i=0;i<window.cartHist.length;i++){
           var cartHist=window.cartHist[i];
           updateGlobalPartitions(cartHist.partitions);
        }
        for (var i=0;i<window.cartHist.length;i++){
           var cartHist=window.cartHist[i];
           refilterGlobalPartitions(cartHist,i);
        }
        fixpartitions();
        var filtStrings = createFiltStrings();
        var solrStr = createSolrString(filtStrings);
        window.solrStr = solrStr;
        var ii=1;
    }

    fixpartitions = function(){
      var isempty = new Array();
      for (var i=0;i<window.cartHist.length;i++){
          if (Object.keys(window.cartHist[i].filter).length==0){
              isempty.push(true);
          }
          else{
              isempty.push(false);
          }
      }

      for (var i=0;i<window.partitions.length;i++){
          var nfilts = new Array();
          for (var j=0; j<window.partitions[i].filt.length;j++){
              var remv = false;
              for (var k=1;k<window.partitions[i].filt[j].length;k++){
                  filt= window.partitions[i].filt[j][k]
                  if (isempty[filt]){
                      remv = true;
                      break;
                  }
              }
              if (!remv){
                  nfilts.push(window.partitions[i].filt[j])
              }
          }
          window.partitions[i].filt=nfilts;
          if (nfilts.length ==0){
              window.partitions[i].null = true;
          }
      }

    }

    updateGlobalPartitions= function(newparts){
        //var newparts = cartHist.partitions;
        for (var i=0;i<newparts.length;i++){
            var inserted = false;
            var nxtpart=newparts[i];
            var nxtlen = nxtpart.length;
            var basefilt = new Array();
            for (var j=0;j<window.partitions.length;j++){
                var eql = true;
                var lt = false;
                curpart = window.partitions[j]['id'];
                curpartlen = curpart.length;

                var numcmp = Math.min(nxtpart.length, curpart.length);
                for (k=0;k<numcmp;k++){
                   if (nxtpart[k]<curpart[k]){
                       lt = true;
                       eql = false
                       break;
                   }
                   else if (nxtpart[k]>curpart[k]){
                       eql = false;
                   }
               }
                if (lt || (eql && (nxtpart.length<curpart.length))){
                   var insertInd=j;
                   inserted = true;
                   addNewPartition(nxtpart, insertInd, basefilt)
                   break;
               }
                else if (eql && (nxtpart.length==curpart.length)){
                 inserted = true;
                 break;
               }

                else if (eql && (nxtpart.length==curpart.length+1)){
                 window.partitions[j]['not'].push(nxtpart[nxtpart.length-1]);
                 window.partitions[j]['not'].sort();
                 for (var filtprt=0;filtprt<window.partitions[j]['filt'].length;filtprt++){
                     var tmp = window.partitions[j]['filt'][filtprt];
                     basefilt.push([...tmp])
                 }
               }

            }
            if (!inserted){
               addNewPartition(nxtpart, -1, basefilt);
           }
        }

    }
    refilterGlobalPartitions= function(cartHist,cartnum){

        var selections = cartHist['selections'];
        var checkedA = new Array()
        for (var i=0;i<selections.length;i++){
            var ind = selections.length-(1+i);
            var cursel = selections[ind];
            var curid = cursel['sel'];
            var added = cursel['added'];
            for (var j=0;j<window.partitions.length;j++){
                var part = window.partitions[j];
                var partid = part['id'];
                if ((checkedA.indexOf(j)<0) && (curid.length<=partid.length)) {
                    var filt = part['filt'];
                    //var nll = part['null'];
                    var eq = true;
                    for (var k=0; k<curid.length;k++){
                        if (!(curid[k]==partid[k])){
                            eq = false;
                            break;
                        }
                    }
                    if (eq){
                        checkedA.push(j);
                        if (added){
                            part['filt'].push([cartnum]);
                            part['null'] = false;
                        }
                        else if (!part['null']){
                            for (var k=0;k<part['filt'].length;k++){
                                part['filt'][k].push(cartnum);
                            }
                        }
                    }

                }
            }
        }

    }

    createSolrString = function(filtStringA){
        var solrStr=''
        var solrA=[]
        for (var i=0;i< window.partitions.length;i++){
            var curPart = window.partitions[i];
            if (!curPart['null']) {
                var curPartAttStrA = parsePartitionAttStrings(filtStringA, curPart);
                var curPartStr = parsePartitionStrings(curPart);
                for (var j = 0; j < curPartAttStrA.length; j++) {
                    if (curPartAttStrA[j].length > 0) {

                    solrA.push('(' + curPartStr + ')(' + curPartAttStrA[j] + ')')
                    }
                    else{
                        solrA.push(curPartStr);
                    }
                }
            }
        }
        solrA = solrA.map(x => '('+x+')');
       var solrStr = solrA.join(' OR ')
        return solrStr
    }

    parsePartitionAttStrings = function(filtStringA, partition){
        var attStrA =[];
        var filt2D = partition['filt'];
        for (var i=0; i<filt2D.length;i++){
            filtL=filt2D[i];
            var tmpA=[]
            for (var j=0;j<filtL.length;j++){
                var filtindex= filtL[j]
                filtStr=filtStringA[filtindex];
                if (filtStr.length>0){
                    if (j==0){
                        tmpA.push('('+filtStr+')')
                    }
                    else{
                        tmpA.push('NOT ('+filtStr+')')
                    }
                }

            }
            attStrA.push(tmpA.join(' AND '))
        }
        return attStrA;
    }

    parsePartitionStrings = function(partition){
        var filts = ['collection_id', 'PatientID', 'StudyInstanceUID','SeriesInstanceUID']
        var id = partition['id']
        var partStr='';
        for (var i=0;i<id.length;i++){
            partStr+='(+'+filts[i]+':("'+id[i]+'"))';
        }
        var not= partition['not'];
        if (not.length>0){
            not= not.map(x => '"'+x+'"');
            var notStr= not.join(' OR ');
            partStr=partStr+' AND NOT ('+filts[id.length]+':('+notStr+'))';
        }
        return partStr
    }
    createFiltStrings = function(){
        var filtStrings = new Array();
        var attA = [];
        for (var i=0;i<window.cartHist.length;i++){
            var filt= window.cartHist[i]['filter'];
            filtkeys = Object.keys(filt);
            var fstr=''
            for (var j=0;j<filtkeys.length;j++) {
                fkey = filtkeys[j];
                //if (!(fkey == "collection_id")){
                if (true){
                    var nstr = '(+' + fkey + ':(';
                   var attA = ('values' in filt[fkey] && (Array.isArray(filt[fkey]['values']))) ? filt[fkey]['values'] : filt[fkey];
                   var op = ('op' in filt[fkey]) ? filt[fkey]['op'] : 'OR';
                   attA = attA.map(x => '"' + x + '"')
                   nstr = nstr + attA.join(' ' + op + ' ') + '))';
                  fstr = fstr + nstr;
               }
            }
            filtStrings.push(fstr);
        }
        return(filtStrings);
    }

    addNewPartition= function(part, pos, basefilt) {
        newPart = new Object();
        newPart['not'] = new Array();
        newPart['id'] = [...part]
        newPart['filt'] = basefilt;
        newPart['null'] = true;
        if (pos > -1) {
           window.partitions.splice(pos, 0, newPart);
         }
        else{
            window.partitions.push(newPart);
        }
    }


    mkOrderedPartitions = function(selections){
        parts=new Array();

        possibleParts = new Array();
        for (var i=0;i<selections.length;i++){
            cursel = selections[i]['sel'];
            nxt = new Array();
            for (j=0; j< cursel.length;j++){
                nxt = [...nxt]
                nxt.push(cursel[j])
                possibleParts.push(nxt);

            }
        }

        for (var i=0;i<possibleParts.length;i++){
            nxtpart = possibleParts[i];
            var inserted = false;

           for (j =0; j< parts.length;j++){
               var eql = true;
               var lt = false;
               var curpart = parts[j];
               var numcmp = Math.min(nxtpart.length, curpart.length);
               for (k=0;k<numcmp;k++){
                   if (nxtpart[k]<curpart[k]){
                       lt = true;
                       eql = false
                       break;
                   }
                   else if (nxtpart[k]>curpart[k]){
                       eql = false;
                   }
               }
               if (lt || (eql && (nxtpart.length<curpart.length))){
                   insertInd=j
                   inserted = true;
                   parts.splice(insertInd, 0, nxtpart)
                   break;
               }
               else if (eql && (nxtpart.length==curpart.length)){
                 inserted = true;
                 break;
               }
           }
           if (!inserted){
               parts.push(nxtpart);
           }

        }
        return parts;
    }


    return {
       mkOrderedPartitions: mkOrderedPartitions,
        formcartdata: formcartdata,
        updateCartSelections: updateCartSelections


    };
});