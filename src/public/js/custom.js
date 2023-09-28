$(function () {
    //$.fn.select2.defaults.set("theme", "bootstrap");
    $('.select2').select2();
    $.ajaxSetup({
        headers: {
            "X-CT": $('meta[name="csrf-token"]').attr('content')
        }
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var searchable = $(e.target).attr("data-table-searchable");
        if (searchable) {
            if ($(searchable).length) {
                if (!$(searchable).hasClass('table-searchable')) {
                    $(searchable).addClass('table-searchable');
                    table_searchable_init($(searchable));
                }
            }
        }
    });
    $(document).on('change', 'select.chained', function (event) {
        chained($(this));
    });

    $("select.chained").each(function () {
        chained($(this));
    });

    $("canvas.chart").each(function () {
        drawChart($(this));
    });


    $(document).on('click', 'a.ajax_html', function (event) {
        var ajax_action = $(this).attr('data-ajax-html');
        var ajax_target = $($(this).attr('data-ajax-html-target'));
        var ajax_id = $(this).attr('data-ajax-html-value');
        var xData = $.xResponse(ajax_action, { id: ajax_id }, ajax_target);
    });
    $(document).on('change', 'select.ajax_html', function () {
        var ajax_action = $(this).attr('data-ajax-html');
        var ajax_target = $($(this).attr('data-ajax-html-target'));
        var ajax_id = $(this).val();
        var xData = $.xResponse(ajax_action, { id: ajax_id }, ajax_target);
    });

    editable_text();
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    });
});

function chained(obj, callback) {
    //var _this    = $(this);
    var _this = obj;
    var target = $(_this.attr('data-ajax-target'));
    var param_id = _this.attr('data-param-id') || 0;
    var ajax_action = _this.attr('data-ajax-action');
    var element_chained = _this.attr('data-ajax-chained') || false;
    var extra_param_name = _this.attr('data-extra-param-name') || false;
    if (false != element_chained && _this.attr('id') == target.attr('id')) {
        var val = $(element_chained).val();
    } else {
        var val = _this.val();
    }
    if (false != extra_param_name) {
        if ('#' == extra_param_name.charAt(0)) {
            val += '&'+extra_param_name.substring(1)+'='+$(extra_param_name).val();
        } else {
            var extra_param_value = _this.attr('data-extra-param-value') || false;
            val += '&'+extra_param_name+'='+extra_param_value;
        }

    }
    console.log(_this.attr('id') + ' - ' + ajax_action);
    var callback = _this.attr('data-param-callback');
    var callback = callback || false;
    if (parseInt(val) == 0 || val === null) {
        target.val('0').change();
        target.empty();
        return false;
    }
    $.ajax({
        url: site.admin_url + '/ajax/' + ajax_action + '/',
        type: 'POST',
        data: 'id=' + val,
        dataType: "json",
        async: true,
        beforeSend: function () {
            target.val('-1').change();
            target.empty();
        },
        success: function (json) {
            $.each(json.data, function (key, value) {
                selected = '';
                if (param_id == key) {
console.log(selected);
selected = ' selected="selected" ';
                }
                target.append($('<option value="' + key + '" ' + selected + '>' + value + '</option>'));
            });
            param_url = getURLParameter(param_id);
            if (param_url !== null) {
                if (parseInt(param_url) != 0) {
target.val(param_url).trigger("change");
                }
            }
            target.select2();
            if (callback) {
                callbackObj = $(callback);
                callback_param = _this.attr('data-param-callback');
                if (!callbackObj.hasClass('chained')) {
callbackObj.addClass('chained');
chained(callbackObj, callback_param);
                }
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert('Error!');
        }
    });
}

function editable_text() {
    if ($('.editable-text').length) {
        $('.editable-text').editable({
            type: 'text',
            pk: 0,
            mode: 'inline',
            params: function (params) {
                params.pk = 'id';
                params.name = $(this).attr("data-name");
                params.pk_value = $(this).attr("data-pk-value");
                return params;
            },
        });
    }
}

function editable_date() {
    if ($('.editable-date').length) {
        $.fn.combodate.defaults.minYear = 2016;
        $.fn.combodate.defaults.maxYear = 2030;
        $('.editable-date').editable({
            type: 'text',
            pk: 0,
            mode: 'inline',
            emptytext: 'Never',
            params: function (params) {
                params.pk = 'id';
                params.name = $(this).attr("data-name");
                params.pk_value = $(this).attr("data-pk-value");
                return params;
            },
            success: function (k, val) {
                if (k.data.id) {
lbl = $('#expiry_date_lbl_' + k.data.id);
lbl.removeClass('label-success').removeClass('label-danger').addClass(k.data.expiry_date_color);
lbl.find('span').text(k.data.expiry_date_lbl);
                }
            }
        });
    }
}

$.extend({
    xResponse: function (uri, data, target) {
        var theResponse = null;
        $.ajax({
            url: site.admin_url + '/ajax/' + uri + '/',
            type: 'POST',
            data: data,
            dataType: "json",
            beforeSend: function () {
                target.html('');
            },
            success: function (respText) {
                target.html(respText.data.html);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert('Error!');
            }
        });
        return theResponse;
    }
});

$(function () {
    $(document).on("click", "a.confirm_delete", function (e) {
        e.preventDefault();
        confirm_delete(e);
    });
    if ($('#message_box').length) {
        setTimeout(function () {
            $("#message_box").fadeTo(500, 0).slideUp(500, function () {
                $(this).remove();
            });
        }, 10000);
    }
    $("input[type='checkbox'], input[type='radio']").iCheck({
        checkboxClass: 'icheckbox_square-blue',
        radioClass: 'iradio_square-blue'
    });
});

(function ($) {
    var _old = $.fn.attr;
    $.fn.attr = function () {
        var a, aLength, attributes, map;
        if (this[0] && arguments.length === 0) {
            map = {};
            attributes = this[0].attributes;
            aLength = attributes.length;
            for (a = 0; a < aLength; a++) {
                map[attributes[a].name.toLowerCase()] = attributes[a].value;
            }
            return map;
        } else {
            return _old.apply(this, arguments);
        }
    }
}(jQuery));

(function () {
    'use strict';
    var queryString = {};

    queryString.parse = function (str) {
        if (typeof str !== 'string') {
            return {};
        }

        str = str.trim().replace(/^\?/, '');

        if (!str) {
            return {};
        }

        return str.trim().split('&').reduce(function (ret, param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            var key = parts[0];
            var val = parts[1];

            key = decodeURIComponent(key);
            // missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            val = val === undefined ? null : decodeURIComponent(val);

            if (!ret.hasOwnProperty(key)) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }

            return ret;
        }, {});
    };

    queryString.stringify = function (obj) {
        return obj ? Object.keys(obj).map(function (key) {
            var val = obj[key];

            if (Array.isArray(val)) {
                return val.map(function (val2) {
return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
                }).join('&');
            }

            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
        }).join('&') : '';
    };

    queryString.push = function (key, new_value) {
        var params = queryString.parse(location.search);
        if (new_value === null) {
            delete params[key];
        } else {
            params[key] = new_value;
        }
        var new_params_string = queryString.stringify(params);
        if (jQuery.isEmptyObject(new_params_string)) {
            history.pushState({}, "", window.location.pathname);
        } else {
            history.pushState({}, "", window.location.pathname + '?' + new_params_string);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = queryString;
    } else {
        window.queryString = queryString;
    }
})(jQuery);

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

$(function () {

    $('.table-searchable').each(function (i, ele) {
        table_searchable_init(ele);
    });
});

function table_searchable_init(ele) {
    var q = $(ele).attr('data-extra-q');
    var pagination2 = $(ele).attr('data-pagination');
    var _page = $(ele).attr('data-page');
    var reset = $(ele).attr('data-reset');
    var no_parameters = $(ele).hasClass('table-searchable-no-parameters');
    var current_page = 1;

    var display = {};
    $(ele).find('thead > tr:first th.filters_view').each(function (idx, el) {
        var view = 1;
        display[$(this).attr('data-json-map')] = {};
        if (typeof $(this).data('default-view') === "undefined") {
            view = 1;
        } else {
            view = parseInt($(this).data('default-view'));
        }
        display[$(this).data('json-map')].checked = (view == 1) ? 'checked="checked"' : '';
        if (typeof $(this).data('filter-view-lbl') === "undefined") {
            display[$(this).data('json-map')].label   = $(this).html();
        } else {
            display[$(this).data('json-map')].label = $(this).data('filter-view-lbl');
        }
    });
    if (0 < Object.keys(display).length) {
        var filters_view = '<div class="row"><div class="col-md-8"></div><div class="col-md-4"><div class="input-group input-group-xs"><div class="input-group-btn" style="padding-bottom:2px;"><button type="button" class="btn btn-default pull-right" data-toggle="collapse" data-target="#filters_view"><i class="fa fa-fw fa-eye"></i></button></div></div><div id="filters_view" class="collapse"><table class="table table-bordered table-striped table-condensed"><tbody><tr>';
        $.each(display, function (idx, cl) {
            filters_view += '<td><input class="filters_view" type="checkbox" data-json-map="'+idx+'" '+display[idx].checked+'> '+display[idx].label+'</td>';
        });
        filters_view += '</tr></tbody></table></div></div></div>';
        $(ele).before(filters_view);
        $("input[type='checkbox'], input[type='radio']").iCheck({
            checkboxClass: 'icheckbox_square-blue',
            radioClass: 'iradio_square-blue'
        });
    }
    $(document).on('click', pagination2 + ' a ', function (event) {
        event.preventDefault();
        if ($(this).attr("href")) {
            page = $(this).attr("href").match(/^\#([0-9]+)\#$/);
            if (page) {
                page = page[1];
            } else {
                return;
            }
        }
        table_searchable(ele, '', page);
    });
    $.each($(ele).attr(), function (key, value) {
        if (key.match(/^data-extra-([^&]+)$/)) {
            key = key.replace('data-extra-', '');
            if (no_parameters == false) {
                param_val = getURLParameter(key);
            } else {
                param_val = null;
            }
            if (value.match(/^\#/)) {
                var _selector = $(value);
            } else {
                var _selector = $("[name='" + value + "']");
            }
            if (_selector.is(':checkbox')) {
                if (_selector.hasClass('icheck')) {
if (param_val !== null && (_selector.attr('value') == param_val)) {
    _selector.iCheck('check');
}
_selector.on('ifToggled', function (e) {
    var isChecked = e.currentTarget.checked;
    if (isChecked) {
        var _v = _selector.val();
    } else {
        var _v = null;
    }
    if (no_parameters == false) {
        queryString.push(key, _v);
    }
    table_searchable(ele, _v, current_page);
});
                } else {
if (param_val !== null && (_selector.attr('value') == param_val)) {
    _selector.prop('checked', true);
}
$(document).on('change', value, function () {
    table_searchable(ele, _selector.val(), current_page);
});
                }
            } else if (_selector.is(':text')) {
                if (param_val !== null) {
_selector.val(param_val);
                }
                if (_selector.hasClass('datepicker')) {
_selector.on('change', function () {
    if (no_parameters == false) {
        queryString.push(key, _selector.val());
    }
    table_searchable(ele, _selector.val(), current_page);
});
                } else {
_selector.on('input', function () {
    if (no_parameters == false) {
        queryString.push(key, _selector.val());
    }
    table_searchable(ele, _selector.val(), current_page);
});
                }
            } else if (_selector.is('select')) {
                if (param_val !== null) {
if (_selector.hasClass('select2')) {
    _selector.val(param_val).trigger("change");
} else {
    _selector.val(param_val);
}
                }
                _selector.on('change', function () {
if (no_parameters == false) {
    queryString.push(key, _selector.val());
}
table_searchable(ele, _selector.val(), current_page);
                });
            } else if (_selector.is(':radio')) {
                if (param_val !== null) {
_selector.filter('[value=' + param_val + ']').prop('checked', true).iCheck('update');
//_selector.filter("[value=" + value + "]").attr('checked', 'checked');
                }
                if (_selector.hasClass('icheck')) {
_selector.on('ifChecked', function (event) {
    if (no_parameters == false) {
        queryString.push(key, $(this).val());
    }
    table_searchable(ele, $(this).val(), current_page);
});
                } else {
_selector.on('ifChecked', function (event) {
    if (no_parameters == false) {
        queryString.push(key, $(this).val());
    }
    table_searchable(ele, $(this).val(), current_page);
});
                }
            }
            if (null !== param_val) {
                _selector.closest('div.collapse').collapse('show');
            }
        }
    });
    table_searchable(ele, q, current_page);
}

function table_searchable(ele, q, page) {
    var action = $(ele).attr('data-action');
    var query = $(ele).attr('data-query');
    var pagination = $(ele).attr('data-pagination');
    var total = $(ele).attr('data-total');
    var _page = $(ele).attr('data-page');
    var screen = $(ele).data('screen');
    var columns_count = $(ele).find('thead > tr:first th').length;
    var attributes = $(ele).find('thead > tr:first th').dataset;
    var outVal = {};
    $(ele).find('thead > tr:first th').each(function (idx, el) {
        outVal[$(this).attr('data-json-map')] = $(el).attr('data-type');
    });
    var obj = {};
    if (typeof _page !== typeof undefined && _page !== false) {
        obj[_page] = page;
    }
    $.each($(ele).attr(), function (key, value) {
        if (key.match(/^data-extra-([^&]+)$/)) {
            key = key.replace('data-extra-', '');
            if (value.match(/^\#/)) {
                var _selector = $(value);
            } else {
                var _selector = $("[name='" + value + "']");
            }
            if (_selector.is(':checkbox')) {
                if (_selector.is(':checked')) {
value = _selector.val();
                } else {
value = null;
                }
            } else if (_selector.is(':text') || _selector.is(':hidden')) {
                value = _selector.val();
            } else if (_selector.is('select')) {
                value = _selector.val();
            } else if (_selector.is(':radio')) {
                value = _selector.filter(':checked').val();
            }
            obj[key] = value;
        }
    });
    var extra_data = $.param(obj);
    $.ajax({
        type: 'POST', url: site.admin_url + '/ajax/' + action + '/',
        data: extra_data,
        dataType: "json",
        async: true,
        beforeSend: function () {
            if ($(ele).find('tbody > tr').length == 0) {
                $(ele).find('tbody').html('<tr><td colspan="' + columns_count + '">Loading ...</td></tr>');
            } else {
                $(pagination).addClass('disabled_div');
                $(ele).addClass('disabled_div');
            }
        },
        success: function (json) {
            json = json.data;
            $(ele).find('tbody').html('');
            if (parseInt(json.total) == 0) {
                $(ele).find('tbody').html('<tr><td colspan="' + columns_count + '">' + site.lang_keys.no_data_found + '</td></tr>');
            }
            $.each(json.footer, function (index, data) {
                var foot_ele = $(ele).find('tfoot > tr td[data-json-map="'+index+'"]');
                if (typeof foot_ele != "undefined") {
                    foot_ele.html(data);
                }
            });
            $.each(json.data, function (index, data) {
                tr = $('<tr>');
                $.each(outVal, function (idx, cl) {
v = data[idx];
td_data = '';
if (typeof v != "undefined") {
    type = outVal[idx];
    td_data = '';
    if (type == 'text') {
        td_data = v;
    } else if (type == 'links') {
        if (typeof v == 'object') {
            $.each(v, function (link_index, link) {
                if (typeof link.links != "undefined") {
if (Object.keys(link.links).length > 0) {
    td_data += '<div class="btn-group">';
    td_data += '   <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">';
    td_data += '       <span class="caret"></span>';
    td_data += '    </button>';
    td_data += '    <ul class="dropdown-menu">';
    $.each(link.links, function (lnki, lnk) {
        if (validURL(lnk) == false) {
            lnk_href = site.admin_url + lnk;
        } else {
            lnk_href = lnk;
        }
        td_data += '        <li><a href="' + lnk_href + '">' + lnki + '</a></li>';
    });
    td_data += '    </ul>';
    td_data += '</div>';
} else {
    td_data += '';
}
                } else {
lbl = link.label;
if (typeof link.icon != "undefined") {
    lbl = '<i class="' + link.icon + '"></i>' + link.label;
}
if (link.link == '#') {
    href = '#';
} else {
    if (javascriptURL(link.link) == true) {
        href = link.link;
    } else if (validURL(link.link) == false) {
        href = site.admin_url + link.link;
    } else {
        href = link.link;
    }
}
target = '';
if (typeof link._blank != "undefined") {
    target = ' target="_blank" ';
}
if (typeof link.extra != "undefined") {
    extra = link.extra;
} else {
    extra = '';
}
if (typeof link.id != "undefined") {
    td_data += '<a ' + target + ' class="' + link.class + '" id="' + link.id + '" href="' + href +'" '+ extra +'>' + lbl + '</a> ';
} else {
    td_data += '<a ' + target + ' class="' + link.class + '" href="' + href + '" ' + extra + '>' + lbl + '</a> ';
}
                }
            });
        }
    } else if (type == 'link') {
        td_data += '<a href="' + site.admin_url + v.link + '">' + v.label + '</a>';
        if (typeof v.labels != "undefined") {
            td_data += '<br />';
            $.each(v.labels, function (label_index, label) {
                td_data += '<span class="label label-' + label.type + '">';
                if (typeof label.icon != "undefined") {
td_data += '<i class="' + label.icon + '"></i> ';
                }
                td_data += label.label + '</span> ';
            });
        }
    }
    $(tr).append('<td>' + td_data + '</td>');
}
                });
                $(ele).find('tbody').append(tr);
            });
            $(pagination).html(json.pagination);
            $(total).html(site.lang_keys.total_result + ': <b>' + json.total + '</b>');
            $(ele).removeClass('disabled_div');
            $(pagination).removeClass('disabled_div');
            $(function () {
              $('[data-toggle="tooltip"]').tooltip()
            });
            editable_text();
            editable_date();
            $("input:checkbox.filters_view").on('ifChanged', function() {
                let index = $('table th[data-json-map=' + $(this).data("json-map") + ']').index();
                var foot_ele = $(ele).find('tfoot > tr td[data-json-map="'+$(this).data("json-map")+'"]');
                if ($(this).is(':checked')) {
                    $('table th[data-json-map=' + $(this).data("json-map") + ']').show();
                    $('table tr td:nth-child('+(index+1)+')').show();
                    if (typeof foot_ele != "undefined") {
                        foot_ele.show();
                    }
                } else {
                    $('table th[data-json-map=' + $(this).data("json-map") + ']').hide();
                    $('table tr td:nth-child('+(index+1)+')').hide();
                    if (typeof foot_ele != "undefined") {
                        foot_ele.hide();
                    }
                }
                if (typeof screen !== "undefined") {
                    var data = new Object();
                    $("input:checkbox.filters_view").each(function() {
                        data[$(this).data('json-map')] = $(this).is(':checked');
                    });
                    $.ajax({
                        url: site.admin_url + '/ajax/users.save_filters_view/',
                        type: 'POST',
                        data: "screen="+screen+'&'+toQueryString(data, 'fields'),
                        dataType: "json",
                        async: true,
                        beforeSend: function () {
                        },
                        success: function (json) {
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            alert('Error!');
                        }
                    });
                }
            });
            $("input:checkbox.filters_view:not(:checked)").each(function() {
                let index = $('table th[data-json-map=' + $(this).data("json-map") + ']').index();
                $('table th[data-json-map=' + $(this).data("json-map") + ']').hide();
                $('table tr td:nth-child('+(index+1)+')').hide();
                var foot_ele = $(ele).find('tfoot > tr td[data-json-map="'+$(this).data("json-map")+'"]');
                if (typeof foot_ele != "undefined") {
                    foot_ele.hide();
                }
            });
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert('Error!');
        },
    });
    return;
}

function toQueryString(obj, prefix) {
    var str = [];
    for(var p in obj) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v == "object" ?
          toQueryString(v, k) :
          encodeURIComponent(k) + "=" + (v));
    }
    return str.join("&");
}

function drawChart(element) {
    const types = ["bar", "line", "pie", "doughnut", "polarArea"];
    let type        = element.data('type');
    let title       = element.data('title');
    let interval    = element.data('interval');
    let ajax_action = null;//element.data('ajax_action');
    let data        = element.data('data');
    if (false == types.includes(type)) {
        type = "line";
    }
    if (validate.isEmpty(ajax_action) && validate.isEmpty(data)) {
        alert(element.attr('id')+' data or ajax_action undefined');
        return;
    } else {
        if (validate.isEmpty(data)) {
            data = [];
        }
    }
    if (validate.isEmpty(title)) {
        title = {display:false, text:''};
    } else {
        title = {display:true, text:title};
    }
    if (validate.isEmpty(interval) || 1 > parseInt(interval)) {
        interval = false;
    } else {
        interval = parseInt(interval)*1000*60;
    }
    let canvas = element.get(0).getContext('2d');
    let chart  = new Chart(canvas, {
        type: type,
        data: data,
        options: {
            responsive: true,
            scales: {
                y : {
                    beginAtZero: false,
                }
            },
            legend: {
                position: 'top',
            },
            plugins: {
                title: title
            },
        }
    });
    if ('pie' == type) {
        chart.options.scales = [];
    }
    chart.update();
    if (!validate.isEmpty(ajax_action)) {
        let interval_function = function ajax() {
            element.nextAll('.chart-loader').remove();
            loader = element.after('<i class="fa fa-spin fa-refresh pull-right chart-loader"></i>');
            $.ajax({
                url: site.admin_url + '/ajax/' + ajax_action + '/',
                type: 'POST',
                data: '',
                dataType: "json",
                async: true,
                beforeSend: function () {
                },
                success: function (json) {
                    if (false == validate.isEmpty(json.data.options)) {
                        Object.keys(json.data.options).forEach(key => {
                            chart.options[key] = json.data.options[key];
                        });
                    }
                    if (false == validate.isEmpty(json.data.labels)) {
                        chart.data.labels = json.data.labels;
                    }
                    chart.data.datasets = json.data.datasets;

                    chart.update();
                    element.nextAll('.chart-loader').remove();
                    if (false != interval) {
                        setTimeout(interval_function, interval);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert('Error!');
                }
            });
        }
        if (!validate.isEmpty(data)) {
            setTimeout(interval_function, interval);
        } else {
            interval_function();
        }

    }
}

function confirm_delete(e) {
    if (typeof $(e.target).attr('href') === "undefined") {
        var href = $(e.target).parent().attr('href');
    } else {
        var href = $(e.target).attr('href');
    }
    bootbox.dialog({
        message: site.lang_keys.confirm_delete_hint,
        title: site.lang_keys.confirm_delete_title,
        buttons: {
            danger: {
                label: site.lang_keys.yes,
                className: "btn-danger",
                callback: function () {
window.location.href = href;
                }
            },
            main: {
                label: site.lang_keys.no,
                className: "btn-info",
                callback: function () { }
            }
        }
    });
}

function msg(msg, type) {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": true,
        "positionClass": "toast-bottom-right",
        "onclick": null,
        "showDuration": "400",
        "hideDuration": "1000",
        "timeOut": "7000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    if (type == 'error') {
        toastr.error(msg, '');
    } else {
        toastr.success(msg, '');
    }
}

$.fn.select2.amd.require(['select2/selection/search'], function (Search) {
    Search.prototype.searchRemoveChoice = function (decorated, item) {
        this.trigger('unselect', {
            data: item
        });
        this.$search.val('');
        this.handleSearch();
    };
}, null, true);

function search_select_func(select_obj, ajax_action, multiple, SelectionLength, minimumInputLength, force_z_index, extra_params) {
    var multiple = multiple || false;
    var SelectionLength = SelectionLength || 0;
    var minimumInputLength = minimumInputLength || 0;
    var force_z_index = force_z_index || false;
    var extra_params = extra_params || false;
    _select2 = $(select_obj).select2({
        placeholder: 'Search ..',
        minimumInputLength: minimumInputLength,
        multiple: multiple,
        allowClear: true,
        maximumSelectionLength: SelectionLength,
        ajax: {
            dataType: 'json',
            type: 'POST',
            url: site.admin_url + '/ajax/' + ajax_action,
            delay: 250,
            data: function (params) {
                p = {
q: params.term,
selected: _select2.val()
                };
                if (extra_params) {
var object = $.extend({}, p, extra_params);
                } else {
var object = p;
                }
                return object;
            },
            processResults: function (data, params) {
                params.page = params.page || 1;
                var select2Data = $.map(data.data, function (obj) {
obj.id = obj.id;
obj.text = obj.text;
return obj;
                });
                return {
results: select2Data
                };
            }
        }
    });
    if (force_z_index === true) {
        _select2.data('select2').$container.addClass('select2_container_custom_class');
        _select2.data('select2').$dropdown.addClass('select2_dropdown_custom_class');
    }
}
/**
 * Dynamic Key Value
 */
$(function () {
    $(document).on("click", ".key_value_group_btn", function (e) {
        e.preventDefault();
        var _this = $(this);
        var key_valye_group = _this.attr('data-key_value');
        var _key = $('#key_' + key_valye_group);
        var _value = $('#value_' + key_valye_group);
        var tbl = $('#key_value_tbl_' + key_valye_group);
        var count = parseInt(tbl.find('tr').length) || 0;
        if (_key.val().trim() && _value.val().trim()) {
            tr = '<tr>';
            tr += '    <td style="width:50%;">' + _key.val() + '<input type="hidden" name="params[' + key_valye_group + '][key][' + (count + 1) + ']" value="' + htmlEntities(_key.val()) + '" /></td>';
            tr += '    <td style="width:50%;">' + _value.val() + '<input type="hidden" name="params[' + key_valye_group + '][value][' + (count + 1) + ']" value="' + htmlEntities(_value.val()) + '" /></td>';
            tr += '    <td style="width:25px;">';
            tr += '        <button class="btn btn-danger btn-sm del_tbl_row"><i class="fa fa-trash-o"></i></button>';
            tr += '    </td>';
            tr += '</tr>';
            tbl.find('tbody').append(tr);
            _key.val('');
            _value.val('');
            tbl.show();
        }
    });
    $(document).on("click", ".del_tbl_row", function (e) {
        e.preventDefault();
        $(this).closest('tr').remove();
        hide_if_empty();
    });
});

function hide_if_empty() {
    $('.hide_if_empty').each(function (i, obj) {
        rows_count = parseInt($(obj).find('tr').length) || 0;
        if (rows_count == 0) {
            $(obj).hide();
        } else {
            $(obj).show();
        }
    });
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}

function javascriptURL(str)
{
    return str.startsWith('javascript:');
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

$(document).ready(function () {
    $('.from_to').each(function() {
        let current  = new Date();
        let start    = ('' != $(this).data('start')) ? new Date($(this).data('start')) : current;
        let end      = ('' != $(this).data('end')) ? new Date($(this).data('end')) : null;
        let minStart = ('' != $(this).data('min_start')) ? new Date($(this).data('min_start')) : current;
        $(this).daterangepicker({
            singleDatePicker: false,
            autoUpdateInput:false,
            showDropdowns:true,
            startDate : start,
            endDate : end,
            maxDate: current,
            opens: 'right',
            locale: {
                format: 'DD/MM/YYYY',
            },
            ranges: {
                'Today': [moment(), moment().add(1, 'days')],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            startDate: moment(),
            endDate: moment()
        });
        $(this).on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
        });
    });
    $(document).on("click", "a.x_tracking_id", function (event) {
        event.preventDefault();
        $('#info-Modal').modal('show');
        var x_tracking_id = $(this).data('tracking-id');
        $('#info-ModalLabel').html('Tracking: '+x_tracking_id);
        $('#info-Modal').find('.modal-body').html('Loading ...');
        $.ajax({
            url: site.admin_url + '/ajax/stats.get_tracking_info/',
            type: 'POST',
            data: 'x_tracking_id=' + x_tracking_id,
            dataType: "json",
            async: true,
            beforeSend: function () {
            },
            success: function (json) {
                if (json.error === false) {
                    var table = '<table class="table">';
                    table += '<tbody>';
                    $.each(json.data, function (i, item) {
                        table += '<tr><td>' + i + '</td><td>' + (typeof item === 'object' ? JSON.stringify(item) : item) + '</td></tr>';
                    });
                    table += '</tbody>';
                    table += '</table>';
                    $('#info-Modal').find('.modal-body').html(table);
                } else {
                    $('#info-Modal').find('.modal-body').html(json.msg);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert('Error!');
            }
        });
    });
    $(document).on("click", "a.callbacks_info", function (event) {
        event.preventDefault();
        $('#info-Modal').modal('show');
        var callback_id = $(this).data('callback-id');
        $('#info-ModalLabel').html('Callback: '+callback_id);
        $('#info-Modal').find('.modal-body').html('Loading ...');
        $.ajax({
            url: site.admin_url + '/ajax/stats.get_callback_info/',
            type: 'POST',
            data: 'callback_id=' + callback_id,
            dataType: "json",
            async: true,
            beforeSend: function () {
            },
            success: function (json) {
                if (json.error === false) {
                    var table = '<table class="table">';
                    table += '<tbody>';
                    $.each(json.data, function (i, item) {
                        table += '<tr><td>' + i + '</td><td>' + (typeof item === 'object' ? JSON.stringify(item) : item) + '</td></tr>';
                    });
                    table += '</tbody>';
                    table += '</table>';
                    $('#info-Modal').find('.modal-body').html(table);
                } else {
                    $('#info-Modal').find('.modal-body').html(json.msg);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert('Error!');
            }
        });
    });
    $(document).on("click", "a.session_info", function (event) {
        event.preventDefault();
        $('#info-Modal').modal('show');
        var session_id = $(this).data('session-id');
        $('#info-ModalLabel').html('Session: '+session_id);
        $('#info-Modal').find('.modal-body').html('Loading ...');
        $.ajax({
            url: site.admin_url + '/ajax/stats.get_session_info/',
            type: 'POST',
            data: 'session_id=' + session_id,
            dataType: "json",
            async: true,
            beforeSend: function () {
            },
            success: function (json) {
                if (json.error === false) {
                    var table = '<table class="table">';
                    table += '<tbody>';
                    $.each(json.data, function (i, item) {
                        table += '<tr><td>' + i + '</td><td>' + (typeof item === 'object' ? JSON.stringify(item) : item) + '</td></tr>';
                    });
                    table += '</tbody>';
                    table += '</table>';
                    $('#info-Modal').find('.modal-body').html(table);
                } else {
                    $('#info-Modal').find('.modal-body').html(json.msg);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert('Error!');
            }
        });
    });
    $(document).on("click", "a.transaction_info", function (event) {
        event.preventDefault();
        $('#info-Modal').modal('toggle');
        var transaction_id = $(this).data('transaction-id');
        $('#info-ModalLabel').html('Transaction: '+transaction_id);
        $('#info-Modal').find('.modal-body').html('Loading ...');
        $.ajax({
            url: site.admin_url + '/ajax/stats.get_transaction_info/',
            type: 'POST',
            data: 'transaction_id=' + transaction_id,
            dataType: "json",
            async: true,
            beforeSend: function () {
            },
            success: function (json) {
                if (json.error === false) {
                    var table = '<table class="table">';
                    table += '<tbody>';
                    $.each(json.data, function (i, item) {
                        table += '<tr><td>' + i + '</td><td>' + (typeof item === 'object' ? JSON.stringify(item) : item) + '</td></tr>';
                    });
                    table += '</tbody>';
                    table += '</table>';
                    $('#info-Modal').find('.modal-body').html(table);
                } else {
                    $('#info-Modal').find('.modal-body').html(json.msg);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert('Error!');
            }
        });
    });
    
});
