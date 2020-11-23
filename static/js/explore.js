require.config({
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.5.1',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        underscore: 'libs/underscore-min',
        tablesorter: 'libs/jquery.tablesorter.min',
        base: 'base',
        imagesearch: 'image_search',
        cohortfilelist: 'cohort_filelist',
        tippy: 'libs/tippy-bundle.umd.min',
        '@popperjs/core': 'libs/popper.min'
    },
    shim: {
        '@popperjs/core': {
          exports: "@popperjs/core"
        },
        'tippy': {
          exports: 'tippy',
            deps: ['@popperjs/core']
        },
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'tablesorter': ['jquery'],
        'base': ['jquery']

    }
});

require([
    'jquery',
    'tippy',
    'base',
    'imagesearch',
    'jqueryui',
    'bootstrap',
    'tablesorter',
    'cohortfilelist',
], function ($, tippy, base, imagesearch, d3, cohortfilelist) {
    var saving_cohort = false;

    $('#save-cohort-modal').on('show.bs.modal', function() {
        var filters = {};
        $('#program_set input:checked, ' +
            '#search_orig_set .search-checkbox-list input:checked, ' +
            '#search_related_set .search-checkbox-list input:checked, ' +
            '#search_derived_set .search-checkbox-list input:checked').each(function(){

            let modal_filter_block = '';
            if($(this).parents('#program_set').length > 0) {
                modal_filter_block = '#selected-filters-prog-set';
            } else if($(this).parents('#search_orig_set').length > 0) {
                modal_filter_block = '#selected-filters-orig-set';
            } else if($(this).parents('#search_related_set').length > 0) {
                modal_filter_block = '#selected-filters-rel-set';
            } else if($(this).parents('#search_derived_set').length > 0) {
                modal_filter_block = '#selected-filters-der-set';
            }

            if($(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).length <= 0) {
                $(`${modal_filter_block}`).append('<p class="cohort-filter-display '+$(this).data('filter-attr-id')
                    +'"><span class="attr">'+$(this).data('filter-display-attr')+':</span></p>');
            }
             $(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).append(
                 '<span class="val">'+$(this).data('filter-display-val')+'</span>'
             );
            if(!filters[$(this).data('filter-attr-id')]) {
                filters[$(this).data('filter-attr-id')] = [];
            }
            filters[$(this).data('filter-attr-id')].push($(this).prop('value'));
        });

        $('.ui-slider').each(function() {
            let modal_filter_block = '';
            if($(this).parents('#program_set').length > 0) {
                modal_filter_block = '#selected-filters-prog-set';
            } else if($(this).parents('#search_orig_set').length > 0) {
                modal_filter_block = '#selected-filters-orig-set';
            } else if($(this).parents('#search_related_set').length > 0) {
                modal_filter_block = '#selected-filters-rel-set';
            } else if($(this).parents('#search_derived_set').length > 0) {
                modal_filter_block = '#selected-filters-der-set';
            }

            var $this = $(this);
            var left_val = $this.slider("values", 0);
            var right_val = $this.slider("values", 1);
            var min = $this.slider("option", "min");
            var max = $this.slider("option", "max");
            if (left_val !== min || right_val !== max) {
                if($(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).length <= 0) {
                    $(`${modal_filter_block}`).append('<p class="cohort-filter-display '+$(this).data('filter-attr-id')
                        +'"><span class="attr">'+$(this).data('filter-display-attr')+':</span></p>');
                }
                 $(`${modal_filter_block} p.`+$(this).data('filter-attr-id')).append(
                     '<span class="val">'+left_val + " to "+right_val+'</span>'
                 );
                filters[$(this).data('filter-attr-id')] = [left_val,right_val];
            }
        });

        $('#save-cohort-modal .selected-filters').each(function(){
            if($(this).find('span').length <= 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
        $('input[name="selected-filters"]').prop('value', JSON.stringify(filters));
    });

    $('#save-cohort-modal').on('hide.bs.modal', function(e) {
        if(saving_cohort) {
            e.preventDefault();
            return false;
        }
        $('#save-cohort-modal .selected-filters p').remove();
        $('input[name="selected-filters"]').prop('value', '');
        $('#saving-cohort').css('display','none');
        $(this).find('input[type="submit"]').prop("disabled","");
    });

    $('#save-cohort-form, #apply-edits-form').on('submit', function(e) {

        $('#unallowed-chars-alert').hide();
        $('#name-too-long-alert-modal').hide();

        var name = $('#save-cohort-name').val() || $('#edit-cohort-name').val();
        var desc = $('#save-cohort-desc').val() || $('#edit-cohort-desc').val();

        var unallowed = (name.match(base.blacklist) || []).concat(desc ? desc.match(base.blacklist) || [] : []);

        if(unallowed.length > 0) {
            $('.unallowed-chars').text(unallowed.join(", "));
            $('#unallowed-chars-alert').show();
            e.preventDefault();
            return false;
        }

        if(name.length > 255) {
            $('#name-too-long-alert-modal').show();
            e.preventDefault();
            return false;
        }

        $(this).find('input[type="submit"]').attr("disabled","disabled");
        $('#saving-cohort').css('display','inline-block');
        saving_cohort = true;
        $('#save-cohort-modal').prop("saving", "saving");
    });


    tippy('.collection_name', {
        content: function(reference) {
            let tooltip = collection_tooltips[$(reference).siblings('input.collection_value').attr('value')];
            if(tooltip) {
                return '<div class="collection-tooltip">'+tooltip+'</div>';
            }
            return '<span></span>';

        },
        theme: 'light',
        placement: 'right-end',
        arrow: false,
        allowHTML: true,
        interactive: true
    });

    tippy('.tooltip_filter_info',{
        content: 'Each chart below reports the number of cases (or patients) for all values within a given attribute, given the currently defined filter set. Once a case is selected, all series for that case, including those that do not meet the search criteria, are included. For example, cases selected based on the presence of CT modality may also contain PET modality, and thus counts for both values will appear in the chart, and the manifest.',
        theme: 'light',
        placement: 'right-end',
        arrow: false
    });

    tippy('.tooltip_chart_info',{
        content: 'Counts shown below are the number of cases (or patients) for each attribute value. Counts for each attribute (e.g. Modality) '+
            'are unchanged by the values (e.g. PET) selected (checked) for that attribute. They only change based on the values selected for all other attributes.',
        theme: 'light',
        placement: 'right-end',
        arrow: false
    });

    tippy('.checkbox-none',{
        content: 'Filtering on the \'None\' attribute is not currently supported within derived data.',
        theme: 'light',
        placement: 'top-start',
        arrow: false
    });

    tippy.delegate('.studies-table', {
        content: function(reference) {
            return $(reference).data('study-id');
        },
        theme: 'dark',
        placement: 'right',
        arrow: false,
        target: '.study-id-col',
        maxWidth: 300
    });

    tippy.delegate('.series-table', {
        content: function(reference) {
            return $(reference).data('study-id');
        },
        theme: 'dark',
        placement: 'right',
        arrow: false,
        target: '.study-id-col',
        maxWidth: 300
    });

    tippy.delegate('.series-table', {
        content: 'Please open at the study level to see this series',
        theme: 'dark',
        placement: 'right',
        arrow: false,
        target: '.no-viewer-tooltip',
        maxWidth: 130
    });


    var downloadToken = new Date().getTime();

    $('#download-csv').on('click', function(e) {
        download_manifest("csv", $(this), e)
    });

    $('#download-tsv').on('click', function(e) {
        download_manifest("tsv", $(this), e)
    });

    $('#download-json').on('click', function(e) {
        download_manifest("json", $(this), e)
    });

    $('.export-option input[type="radio"]').click(function(){
        update_export_option($(this).attr("value"));
    });

    var update_export_option = function(export_option) {
        $('#bq-manifest').hide();
        $('#file-manifest').hide();
        $('#' + export_option).show();
        console.log(manifest_count);
        var num_parts = (manifest_count / 65000);
        var selectbox = $('#file-manifest').find('.form-control');
        for (let i = 0; i < num_parts; ++i)
        {
            selectbox.append($('<option/>', {
                value: i,
                text : "File Part " + i
            }));
        }
    };

    update_export_option("file-manifest");

    var download_manifest = function(file_type, clicked_button, e) {
        $('#unallowed-chars-alert').hide();
        $('#name-too-long-alert-modal').hide();

        var name = $('#export-manifest-name').val();
        var unallowed = (name.match(base.blacklist) || []);

        if (name.length == 0) {
            $('#download-csv').prop('title','Please input the name.');
            $('#export-manifest-name')[0].focus();
            e.preventDefault();
            return false;
        }

        if (clicked_button.is('[disabled=disabled]')) {
            e.preventDefault();
            return false;
        }

        if (unallowed.length > 0) {
            $('.unallowed-chars').text(unallowed.join(", "));
            $('#unallowed-chars-alert').show();
            e.preventDefault();
            return false;
        }

        if (name.length > 255) {
            $('#name-too-long-alert-modal').show();
            e.preventDefault();
            return false;
        }

        $('#export-manifest-form').submit();

        $('#download-csv').attr('disabled','disabled');
        $('#download-tsv').attr('disabled','disabled');
        $('#download-json').attr('disabled','disabled');

        $('#download-in-progress').modal('show');

        base.blockResubmit(function() {
            $('#download-csv').removeAttr('disabled');
            $('#download-tsv').removeAttr('disabled');
            $('#download-json').removeAttr('disabled');
            $('#download-in-progress').modal('hide');
        },downloadToken, 'downloadToken');

        var checked_fields = [];
        $('.field-checkbox').each(function()
        {
            var cb = $(this)[0];
            if (cb.checked)
            {
                checked_fields.push(cb.value);
            }
        });

        var checked_columns = [];
        $('.column-checkbox').each(function()
        {
           var cb = $(this)[0];
           if (cb.checked)
           {
               checked_columns.push(cb.value);
           }
        });

        var url = BASE_URL + '/cohorts/download_manifest/' + cohort_id + '/';
        url += ("?file_type=" + file_type);
        url += ("&file_name=" + name);
        url += ("&header_fields=" + JSON.stringify(checked_fields));
        url += ("&columns=" + JSON.stringify(checked_columns));
        url += ("&downloadToken=" + downloadToken);

        location.href = url;
    };

    $('.column-checkbox').change(function() {
        update_download_manifest_buttons();
    });

    $("#export-manifest-name").change(function(){
        update_download_manifest_buttons();
    });

    var update_download_manifest_buttons = function(){
        var num_selected_column =$('.column-checkbox:checked').length;
        var input_cohort_name_len = $('#export-manifest-name').val().length;

        if (input_cohort_name_len == 0 || num_selected_column == 0) {
            $('#download-csv').attr('disabled', 'disabled');
            $('#download-tsv').attr('disabled', 'disabled');
            $('#download-json').attr('disabled', 'disabled');
        }
        else
        {
            $('#download-csv').removeAttr('disabled');
            $('#download-tsv').removeAttr('disabled');
            $('#download-json').removeAttr('disabled');
        }

        if (num_selected_column == 0) {
            $('#no-column-alert-modal').show();
        }
        else
        {
            $('#no-column-alert-modal').hide();
        }
    };

    update_download_manifest_buttons();
});
