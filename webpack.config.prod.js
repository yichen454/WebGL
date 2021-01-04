const webpackMerge = require('webpack-merge');

const base = require('./webpack.config.base');
const path = require('path');

const cdn_host = './';
module.exports = webpackMerge.merge(base, {
	// 出口
	output: {
		path: path.join(__dirname, 'prod')
	}
});