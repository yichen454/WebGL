const webpackMerge = require('webpack-merge');

const base = require('./webpack.config.base');
const path = require('path');

const cdn_host = './';
module.exports = webpackMerge.merge(base, {
	// 指定构建环境  
	mode: "development",
	// 开发环境本地启动的服务配置
	devtool: 'eval-source-map',
	devServer: {
		publicPath: "/",
		contentBase: "./dev", // 服务启动在哪一个文件夹下
		host: "0.0.0.0",
		port: 9000, // 端口号
		// proxy 跨域时模拟接口代理
		hot: false, // devServer开启Hot Module Replacement的功能
		//hotOnly: true // 即便HMP的功能没有生效，浏览器也不能自动刷新
	},
	// 出口
	output: {
		path: path.join(__dirname, 'dev')
	}
});