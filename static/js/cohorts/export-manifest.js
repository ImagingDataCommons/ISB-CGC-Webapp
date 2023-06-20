/**
 *
 * Copyright 2021, Institute for Systems Biology
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
    baseUrl: STATIC_FILES_URL + 'js/',
    paths: {
        jquery: 'libs/jquery-3.5.1',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        underscore: 'libs/underscore-min',
        tablesorter: 'libs/jquery.tablesorter.min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        jquerydt: 'libs/jquery.dataTables.min',
        base: 'base',
        tippy: 'libs/tippy-bundle.umd.min',
        '@popperjs/core': 'libs/popper.min',
        session_security: 'session_security/script'
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
        'jquerydt': ['jquery'],
        'underscore': {exports: '_'},
        'tablesorter': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'session_security': ['jquery'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui']
    }
});

require([
    'jquery',
    'jqueryui',
    'tippy',
    'base', // Do not remove
    'bootstrap',
    'assetscore',
    'assetsresponsive',
], function($, jqueryui, tippy, base) {
    A11y.Core();

    var downloadToken = new Date().getTime();

    $('.modal').on('hide.bs.modal', function() {
        $('.filename-missing').removeClass('filename-missing');
    });

    $('#download-csv').on('click', function(e) {
        download_manifest("csv", $(this), e)
    });

    $('#download-tsv').on('click', function(e) {
        download_manifest("tsv", $(this), e)
    });

    $('#download-json').on('click', function(e) {
        download_manifest("json", $(this), e)
    });

    $('#download-s5cmd').on('click', function(e) {
        download_manifest("s5cmd", $(this), e)
    });

    $('#get-bq-table').on('click',function(e){
        download_manifest('bq',$(this), e);
    });

    var download_manifest = function(file_type, clicked_button, e) {
        let manifest_type = file_type === 'bq' ? 'bq-manifest' : 'file-manifest';

        $('#unallowed-chars-alert').hide();
        $('#name-too-long-alert-modal').hide();

        var name = $('#export-manifest-name').val();
        var unallowed = (name.match(base.blacklist) || []);

        if (name.length == 0) {
            $('#download-csv').prop('title','Please provide a file name.');
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

        $('.get-manifest').attr('disabled','disabled');

        $('#manifest-in-progress').modal('show');

        if(manifest_type == 'file-manifest') {
            base.blockResubmit(function () {
                update_download_manifest_buttons();
                $('#manifest-in-progress').modal('hide');
            }, downloadToken, 'downloadToken');
        }

        var checked_fields = [];
        clicked_button.parents('.tab-pane.manifest').find('.field-checkbox').each(function() {
            var cb = $(this)[0];
            if (cb.checked) {
                checked_fields.push(cb.value);
            }
        });

        var checked_columns = [];
        clicked_button.parents('.tab-pane.manifest').find('.column-checkbox').each(function() {
            var cb = $(this)[0];
            if (cb.checked) {
                checked_columns.push(cb.value);
            }
        });

        $('input[name="file_type"]').val(file_type);
        $('input[name="header_fields"]').val(JSON.stringify(checked_fields));
        $('input[name="columns"]').val(JSON.stringify(checked_columns));
        $('input[name="downloadToken"]').val(downloadToken);
        $('input[name="manifest-type"]').val(manifest_type);

        $('input[name="include_header"]').val('false');

        if(file_type !== 'bq') {
            $('input[name="include_header"]').val(($('#include-header-'
            + (file_type === 's5cmd' ? 's5cmd' : 'file')
                + '-checkbox').is(':checked')) ? 'true' : 'false');
        }

        var select_box_div = $('#file-part-select-box');
        var select_box = select_box_div.find('select');
        if (select_box_div.is(":visible")) {
            var selected_file_part = select_box.children("option:selected").val();
            $('input[name="file_part"]').val(selected_file_part);
        } else {
            $('input[name="file_part"]').val("");
        }

        if(manifest_type == 'file-manifest') {
            $('#export-manifest-form').submit();
        } else {
            $.ajax({
                url: $('#export-manifest-form').attr('action'),
                data: $('#export-manifest-form').serialize(),
                method: 'GET',
                success: function (data) {
                    if(data.message) {
                        base.showJsMessage("info",data.message,true);
                    }
                },
                error: function (xhr) {
                    var responseJSON = $.parseJSON(xhr.responseText);
                    // If we received a redirect, honor that
                    if(responseJSON.redirect) {
                        base.setReloadMsg(responseJSON.level || "error",responseJSON.message);
                        window.location = responseJSON.redirect;
                    } else {
                        base.showJsMessage(responseJSON.level || "error",responseJSON.message,true);
                    }
                },
                complete: function(xhr, status) {
                    update_download_manifest_buttons();
                    $('#manifest-in-progress').modal('hide');
                    $('#export-manifest-modal').modal('hide');
                    $('#export-manifest-form')[0].reset();
                    $('#bq-export-option input').prop('checked', true).trigger("click");
                }
            });
        }
    };

    $('input.form-control[name="file_name"]').on('change', function(){
        $(this).val().length <= 0 ? $(this).addClass('filename-missing') : $(this).removeClass('filename-missing');
    });

    var update_download_manifest_buttons = function(clicked){
        if(clicked) {
            let cohort_row=clicked.parents('tr');
            if (cohort_row.data('inactive-versions') === "True") {
                $('.manifest-bq a').trigger('click');
                $('.download-file a,.file-manifest a').attr('disabled', 'disabled');
                $('.manifest-s5cmd, .manifest-file').addClass('version-disabled');
                $('.manifest-s5cmd a, .manifest-file a').addClass('disabled');
            } else {
                $('.manifest-s5cmd a').trigger('click');
                $('.download-file a, .file-manifest a').removeAttr('disabled');
                $('.manifest-s5cmd a, .manifest-file a').removeClass('disabled');
                $('.manifest-file, .manifest-s5cmd').removeClass('version-disabled');
                let file_parts_count = cohort_row.data('file-parts-count');
                let display_file_parts_count = cohort_row.data('display-file-parts-count')
                if (file_parts_count > display_file_parts_count) {
                    $('#manifest-file').attr('title', 'Your cohort\'s size exceeds the limit for file manifest download--please use BQ export or s5cmd manifest.');
                    $('#manifest-file').attr('disabled', 'disabled');
                } else {
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
            }
        }
    };

    // The Export button for each cohort on the Cohort List Page
    $('#saved-cohorts-list').on('click', '.export-cohort-manifest', function(){
        var cohort_ids = [$(this).data('cohort-id')];

        $('#export-manifest-form').attr(
            'action',
            $('#export-manifest-form').data('uri-base')+"?ids="+encodeURIComponent(cohort_ids.join(","))
        );

        $('input[name="ids"]').val(cohort_ids.join(","))

        $('.manifest-name').find('input.form-control').val("cohorts_"+cohort_ids.join("_")+$('#export-manifest-name').data('name-base'));
        update_download_manifest_buttons($(this));
    });

    // The Export Manifest button on the cohort details page
    $('#export-manifest').on('click',function(){
        $('.manifest-name').find('input.form-control').val(
            is_cohort ? "cohort_"+cohort_id+$('#export-manifest-name').data('name-base') : "file_manifest"
        );
    });

    let bq_disabled_message = 'Exporting to BigQuery requires you to be logged in and have a linked Google Social Account.';
    if(user_is_auth && !user_is_social) {
        bq_disabled_message += ' You can link your account to a Google ID from the '
            +  '<a target="_blank" rel="noopener noreferrer" href="/users/' + user_id + '/">'
            + 'Account Details</a> page.'
    } else {
        bq_disabled_message += ' Please log in with a Google Social account to enable this feature.'
    }

    tippy.delegate('#export-manifest-modal', {
        content: bq_disabled_message,
        theme: 'dark',
        placement: 'right',
        arrow: true,
        interactive: true,
        allowHTML: true,
        target: '.bq-disabled'
    });

    tippy.delegate('#export-manifest-modal', {
        content: "Only a cohort with an active data version can be downloaded as a file",
        theme: 'dark',
        placement: 'top',
        arrow: true,
        interactive: true,
        onTrigger: (instance, event) => {
            if($(event.target).hasClass('version-disabled')) {
                instance.enable();
            } else {
                instance.disable();
            }
        },
        onUntrigger: (instance, event) => {
            instance.enable();
        },
        allowHTML: true,
        target: '.version-disabled'
    });

});