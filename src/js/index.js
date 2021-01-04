import React from 'react'
import ReactDom from 'react-dom'
import '../css/base.css'
import './utils/tool'

import App from './component/app'

window.pageShowCbList = [];
window.pageHideCbList = [];

window.onload = () => {
    pageShowOrHide(
        () => {
            for (var i = 0; i < window.pageShowCbList.length; i++) {
                var callback = window.pageShowCbList[i];
                callback && callback();
            }
        },
        () => {
            for (var i = 0; i < window.pageHideCbList.length; i++) {
                var callback = window.pageHideCbList[i];
                callback && callback();
            }
        }
    );

    window.pageShowCbList.push(() => {
        console.log("show");
    });

    window.pageHideCbList.push(() => {
        console.log("hide");
    });

    ReactDom.render(<App />, document.getElementById('app'))
}

function pageShowOrHide(showCb, hideCb) {
    var hidden, state, visibilityChange;
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
        state = "visibilityState";
    } else if (typeof document.mozHidden !== "undefined") {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
        state = "mozVisibilityState";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
        state = "msVisibilityState";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
        state = "webkitVisibilityState";
    }
    var cb = function () {
        if (document[state] == hidden) {
            hideCb && hideCb();
        } else {
            showCb && showCb();
        }
    };
    document.removeEventListener(visibilityChange, cb, false);
    document.addEventListener(visibilityChange, cb, false);
}