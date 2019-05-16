"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var ws_1 = require("ws");
var app = express();
/*声明商品类*/
var Product = /** @class */ (function () {
    function Product(id, title, price, rating, desc, categories) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.rating = rating;
        this.desc = desc;
        this.categories = categories;
    }
    return Product;
}());
exports.Product = Product;
/*声明评价类*/
var Comment = /** @class */ (function () {
    function Comment(id, productId, timestamp, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timestamp = timestamp;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var products = [
    new Product(1, '第一个商品', 1.99, 3.0, '这是第一个商品，是学习Angular创建的', ['电子产品', '硬件设备']),
    new Product(2, '第二个商品', 2.99, 4.0, '这是第二个商品，是学习Angular创建的', ['图书']),
    new Product(3, '第三个商品', 3.99, 3.0, '这是第三个商品，是学习Angular创建的', ['硬件设备']),
    new Product(4, '第四个商品', 4.99, 5.0, '这是第四个商品，是学习Angular创建的', ['电子产品']),
    new Product(5, '第五个商品', 5.99, 2.0, '这是第五个商品，是学习Angular创建的', ['电子产品', '硬件设备']),
    new Product(6, '第六个商品', 6.99, 4.0, '这是第六个商品，是学习Angular创建的', ['图书'])
];
var comments = [
    new Comment(1, 1, '2019-02-14 09:18', '张三', 3, '一般般吧。'),
    new Comment(2, 1, '2019-01-14 03:28', '李四', 4, '商品不错哦!'),
    new Comment(3, 1, '2019-02-24 05:18', '周', 2, '很差的一次购物体验。'),
    new Comment(4, 2, '2019-03-14 09:08', '黄', 5, '非常喜欢呢！！！')
];
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.get('/api/products', function (req, res) {
    var result = products;
    var params = req.query;
    if (params.title) {
        result = result.filter(function (p) { return p.title.indexOf(params.title) !== -1; });
    }
    if (params.price && result.length > 0) {
        result = result.filter(function (p) { return p.price <= parseInt(params.price); });
    }
    if (params.category !== "-1" && result.length > 0) {
        result = result.filter(function (p) { return p.categories.indexOf(params.category) !== -1; });
    }
    res.json(result);
});
app.get('/api/product/:id', function (req, res) {
    res.json(products.find(function (product) { return product.id == req.params.id; }));
});
app.get('/api/product/:id/comments', function (req, res) {
    res.json(comments.filter(function (comment) { return comment.productId = req.params.id; }));
});
var server = app.listen(8000, 'localhost', function () {
    console.log('服务器已经启动！');
});
/*WebSocket 服务器---------*/
var wsServer = new ws_1.Server({ port: 8085 });
var subscriptions = new Map();
//const wsServer = new Server({port: 8085});
wsServer.on("connection", function (webSocket) {
    webSocket.on("message", function (message) {
        var messageObj = JSON.parse(message.toString());
        var productIds = subscriptions.get(webSocket) || [];
        subscriptions.set(webSocket, productIds.concat([messageObj.productId]));
    });
});
/* -------更新报价，并推送给客户端*/
var currentBids = new Map();
setInterval(function () {
    /*-----更新报价---------*/
    products.forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = currentBid + Number(Math.random() * 5);
        currentBids.set(p.id, newBid);
    });
    /*-----推送给客户端-------*/
    subscriptions.forEach(function (productsIds, ws) {
        if (ws.readyState === 1) {
            var newBids = productsIds.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscriptions.delete(ws);
        }
    });
}, 1000);
