import * as express from 'express';
import * as path from 'path';
import {Server} from "ws";

const app = express();

/*声明商品类*/
export class Product{
    constructor(
        public id: number,
        public title: string,
        public price: number,
        public rating: number,
        public desc: string,
        public categories: Array<string>
    ){
    }
}

/*声明评价类*/
export class Comment {
    constructor(
        public id: number,
        public productId: number,
        public timestamp: string,
        public user: string,
        public rating: number,
        public content: string
    ){}
}

const products: Product[] = [
    new Product(1, '第一个商品', 1.99, 3.0, '这是第一个商品，是学习Angular创建的', ['电子产品', '硬件设备']),
    new Product(2, '第二个商品', 2.99, 4.0, '这是第二个商品，是学习Angular创建的', ['图书']),
    new Product(3, '第三个商品', 3.99, 3.0, '这是第三个商品，是学习Angular创建的', ['硬件设备']),
    new Product(4, '第四个商品', 4.99, 5.0, '这是第四个商品，是学习Angular创建的', ['电子产品']),
    new Product(5, '第五个商品', 5.99, 2.0, '这是第五个商品，是学习Angular创建的', ['电子产品', '硬件设备']),
    new Product(6, '第六个商品', 6.99, 4.0, '这是第六个商品，是学习Angular创建的', ['图书'])
];

const comments: Comment[] = [
    new Comment(1, 1, '2019-02-14 09:18', '张三', 3, '一般般吧。' ),
    new Comment(2, 1, '2019-01-14 03:28', '李四', 4, '商品不错哦!'),
    new Comment(3, 1, '2019-02-24 05:18', '周', 2, '很差的一次购物体验。'),
    new Comment(4, 2, '2019-03-14 09:08', '黄', 5, '非常喜欢呢！！！')
];


app.use('/', express.static(path.join(__dirname, '..', 'client')));

app.get('/api/products', (req, res) => {
    let result = products;
    let params = req.query;

    if(params.title) {
        result = result.filter(p => p.title.indexOf(params.title) !== -1);
    }

    if(params.price && result.length>0) {
        result = result.filter(p => p.price <= parseInt(params.price));
    }

    if(params.category !== "-1" && result.length>0){
        result = result.filter(p => p.categories.indexOf(params.category) !== -1);
    }

    res.json(result);
});

app.get('/api/product/:id',(req, res) => {
    res.json(products.find((product) => product.id==req.params.id));
});

app.get('/api/product/:id/comments', (req, res) => {
    res.json(comments.filter((comment) => comment.productId = req.params.id));
});

const server = app.listen(8000, 'localhost', ()=>{
    console.log('服务器已经启动！');
});


/*WebSocket 服务器---------*/

const wsServer = new Server({port: 8085});

const subscriptions = new Map<any, number[]>();

//const wsServer = new Server({port: 8085});
wsServer.on("connection", webSocket => {
    webSocket.on("message", message => {
        let messageObj = JSON.parse(message.toString());
        let productIds = subscriptions.get(webSocket) || [];
        subscriptions.set(webSocket,[...productIds, messageObj.productId]);

    });
});

/* -------更新报价，并推送给客户端*/
const currentBids = new Map<number, number>();

setInterval(() =>{
    /*-----更新报价---------*/
    products.forEach(p => {
        let currentBid = currentBids.get(p.id) || p.price;
        let newBid = currentBid + Number(Math.random()*5);
        currentBids.set(p.id, newBid);
    });

    /*-----推送给客户端-------*/
    subscriptions.forEach((productsIds: number[], ws) => {
        if (ws.readyState === 1) {
            let newBids = productsIds.map(pid => ({
                productId: pid,
                bid: currentBids.get(pid)
            }));
            ws.send(JSON.stringify(newBids));
        }else {
            subscriptions.delete(ws);
        }

    });

},1000);


