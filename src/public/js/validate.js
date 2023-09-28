var validate = {
    isEmpty : function(value) {
        if (null == value || 'undefined' == (typeof value)) {
            return true;
        }
        if ('' == value) {
            return true;
        }
        return false;
    },
    isDate: function (value) {
        let fullDate = ((value+'').replace(/\//g, ',').replace(/-/g, ',')).split(',');
        let day      = parseInt(fullDate[0]);
        let month    = parseInt(fullDate[1]);
        let year     = parseInt(fullDate[2]);
        let date     = new Array(0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
        if (day > date[month]) {
            if (month == 2 && ((year%4 == 0 && year%100 != 0) || year%400 == 0) && day == 29) {
                return true;
            }
            return false;
        }
        return true;
    },
    isMincharacter: function (value, min) {
        if (value.length < min) {
            return false;
        }
        return true;
    },
    isUrl : function (value) {
        let reg= /^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;
        if(false == reg.test(value)) {
            return false;
        }
        return true;
    },
    isNumeric : function (value) {
        if (!value.toString().match(/^[-]?\d*\.?\d*$/)) {
            return false;
        }
        return true;
    },
    isInt: function(value) {
        if (!value.toString().match(/^-?[0-9]+$/)) {
            return false;
        }
        return true;
    },
    isPhone: function (value) {
        if (!value.toString().match(/^\+?[0-9]+$/) || value.length > 15 || value.length < 10) {
            return false;
        }
        return true;
    },
    isEmail: function (value) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if(false == reg.test(value.trim())) {
            return false;
        }
        return true;
    },
    isAlphanumeric: function (value) {
        var reg = /^[a-zA-Z0-9]+$/;
        if(false == reg.test(value)) {
            return false;
        }
        return true;
    },
    isLetteronly: function (value) {
        var reg = /^[a-zA-Z]+$/;
        if (false == reg.test(value)) {
            return false;
        }
        return true;
    },
    isUsername: function (value) {
        var reg = /^[a-zA-Z0-9]+$/;
        if (false == reg.test(value.trim())) {
            return false;
        }
        return true;
    },
    isNonZero: function (value) {
        if (!this.isNumeric(value) || 0 == parseInt(value)) {
            return false;
        }
        return true;
    },
    isGraterThanZero: function (value) {
        if (!this.isNumeric(value) || parseInt(value) < 0) {
            return false;
        }
        return true;
    },
    isLessThanZero: function (value) {
        if (!this.isNumeric(value) || parseInt(value) >= 0) {
            return false;
        }
        return true;
    },
    isMax: function (value, max) {
        if (!this.isNumeric(value) || parseInt(value) > max) {
            return false;
        }
        return true
    },
    isMin: function (value, min) {
        if (!this.isNumeric(value) || parseInt(value) < min) {
            return false;
        }
        return true
    },
    isRange: function (value, min, max) {
        if (!this.isNumeric(value) || !(parseInt(value) >= min && parseInt(value) <= max)) {
            return false;
        }
        return true;
    }
};
