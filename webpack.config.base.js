const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const {
	CleanWebpackPlugin
} = require('clean-webpack-plugin')

var path = require('path');

const cdn_host = './';
module.exports = {
	// 入口
	entry: {
		index: path.join(__dirname, '/src/js/index.js')
	},
	// 出口
	output: {
		path: path.join(__dirname, 'base'),
		filename: "js/[name].[hash:8].js", // js文件名chunkhash防缓存
		publicPath: cdn_host
	},
	resolve: {
		extensions: ['.js', '.jsx']
	},
	// 模块
	module: {
		rules: [{
			test: /\.(js|jsx)$/, //一个匹配loaders所处理的文件的拓展名的正则表达式，这里用来匹配js和jsx文件（必须）
			exclude: /node_modules/, //屏蔽不需要处理的文件（文件夹）（可选）
			loader: 'babel-loader', //loader的名称（必须）
		},
		{
			test: /\.css$/,
			use: [{
				loader: 'style-loader', // 创建 <style></style>
			},
			{
				loader: 'css-loader', // 转换css
			}
			]
		},
		{
			test: /\.less$/,
			use: [{
				loader: 'style-loader',
			},
			{
				loader: 'css-loader',
			},
			{
				loader: 'less-loader', // 编译 Less -> CSS
				options: {
					lessOptions: { // 如果使用less-loader@5，请移除 lessOptions 这一级直接配置选项。
						javascriptEnabled: true,
					},
				}
			},
			],
		},
		{
			test: /\.(png|jpe?g|gif|svg|)(\?.*)?$/,
			loader: 'url-loader',
			options: {
				limit: 8192, // url-loader 包含file-loader，这里不用file-loader, 小于8kb的图片base64的方式引入，大于8kb的图片以路径的方式导入
				name: 'img/[name].[hash:8].[ext]',
				publicPath: cdn_host
			}
		},
		{
			test: /\.(mp4|avi)(\?.*)?$/,
			loader: 'url-loader',
			options: {
				limit: 8192,
				name: 'video/[name].[hash:8].[ext]',
				publicPath: cdn_host
			}
		},
		{
			test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
			loader: 'url-loader',
			options: {
				limit: 8192, // 小于8kb的图片base64的方式引入，大于8kb的图片以路径的方式导入
				name: 'fonts/[name].[hash:8].[ext]',
				publicPath: cdn_host
			}
		}, {
			test: /\.(gltf|hdr)$/,
			use: [{
				loader: 'file-loader',
				options: {
					name: 'assets/[name].[hash:8].[ext]',
					publicPath: cdn_host
				}
			}]
		}
		]
	},
	// 插件
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			title: 'webgl',
			filename: 'index.html', // html模板的生成路径
			template: './src/index.html', //html模板
			inject: true, // true：默认值，script标签位于html文件的 body 底部
			hash: true, // 在打包的资源插入html会加上hash
			//  html 文件进行压缩
			minify: {
				removeComments: true, //去注释
				collapseWhitespace: true, //压缩空格
				removeAttributeQuotes: true //去除属性 标签的 引号  例如 <p id="test" /> 输出 <p id=test/>
			}
		}),
		new CopyPlugin({
			patterns: [
				{ from: "./src/model", to: "./model" },
				{ from: "./src/geoJson", to: "./geoJson" },
				{ from: "./src/textures", to: "./textures" },
			],
			options: {
				concurrency: 100,
			},
		}),
	]
}
