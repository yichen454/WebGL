import Hammer from 'hammerjs'

window._ = {
    /**
     * 存储localStorage
     */
    setStore: (name, content) => {
        if (!name) return;
        if (typeof content !== 'string') {
            content = JSON.stringify(content);
        }
        window.localStorage.setItem(name, content);
    },
    /**
     * 获取localStorage
     */
    getStore: (name) => {
        if (!name) return;
        return window.localStorage.getItem(name);
    },
    /**
     * 清除localStorage
     */
    clearStore: () => {
        window.localStorage.clear();
    },

    getQueryStringByName: (name) => {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        var context = "";
        if (r != null)
            context = r[2];
        reg = null;
        r = null;
        return context == null || context == "" || context == "undefined" ? "" : context;
    },

    isEmpty: (obj) => {
        if (typeof obj == "undefined" || obj == null || obj == "") {
            return true;
        } else {
            return false;
        }
    },

    checkIsPhone: (str) => {
        var myReg = /^0?1[3|4|5|6|7|8|9][0-9]\d{8}$/;
        if (myReg.test(str)) {
            return true;
        }
        return false;
    },

    formatInt: (number, len) => {
        var mask = "";
        var returnVal = "";
        for (var i = 0; i < len; i++) mask += "0";
        returnVal = mask + number;
        returnVal = returnVal.substr(returnVal.length - len, len);
        return returnVal;
    },

    deleteArrayItem: (val, arr) => {
        function inArray(val, arr) {
            for (var i in arr) {
                if (arr[i] == val) {
                    return i;
                }
            }
            return -1;
        }

        var key = inArray(val, arr);
        if (key >= 0) {
            arr.splice(key, 1);
        }
    },

    createImgList(start, end, path, format) {
        let list = [];
        for (let i = start; i <= end; i++) {
            list.push(path + formatInt(i, 3) + '.' + format + '?v=1');
        }

        function formatInt(number, len) {
            var mask = "";
            var returnVal = "";
            for (var i = 0; i < len; i++) mask += "0";
            returnVal = mask + number;
            returnVal = returnVal.substr(returnVal.length - len, len);
            return returnVal;
        }
        return list;
    },

    toast: (params, container) => {
        var el = document.createElement("div");
        el.setAttribute("id", "toast");
        el.innerHTML = params.message;
        container.appendChild(el);
        el.classList.add("fadeIn");
        setTimeout(function () {
            el.classList.remove("fadeIn");
            el.classList.add("fadeOut");
            el.addEventListener("animationend", function () {
                container.removeChild(el);
            });
        }, params.time);
    },

    addClickListener: (id, callback, mistakeTime = 300) => {
        let hm = new Hammer.Manager(typeof id == "string" ? document.getElementById(id) : id);
        hm.add(new Hammer.Tap());
        hm.clicking = false;
        hm.on('tap', function (event) {
            if (hm.clicking) {
                return;
            }
            hm.clicking = true;
            callback(event);
            setTimeout(() => {
                if (hm)
                    hm.clicking = false;
            }, mistakeTime);
        });
        return hm;
    },

    preLoadImg: (imgList, callback) => {
        let paths = {};
        let count = 0;
        let loadCount = 0;
        for (let i in imgList) {
            let src = imgList[i];
            if (src.indexOf("data:image/") == 0) {
                continue;
            }
            if (!paths[src] === true) {
                count++;
                paths[src] = true;
            }
        }

        let imgs = [];
        for (const key in paths) {
            // count++;
            let img = new Image();
            img.src = key;
            img.onload = function () {
                loadCount++;
                callback && callback(loadCount, count, img.src);
                img.onload = null;
            }
            imgs.push(img);
        }
        return imgs;
    },

    loadAudio(url, loop) {
        var audio = new Howl({
            src: url,
            loop: loop,
            volume: 1
        });
        return audio;
    }
}