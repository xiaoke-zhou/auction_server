import * as express from 'express';
import * as path from 'path';
import {Server} from "ws";

const app = express();

/*������Ʒ��*/
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

/*����������*/
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
    new Product(1, '��һ����Ʒ', 1.99, 3.0, '���ǵ�һ����Ʒ����ѧϰAngular������', ['���Ӳ�Ʒ', 'Ӳ���豸']),
    new Product(2, '�ڶ�����Ʒ', 2.99, 4.0, '���ǵڶ�����Ʒ����ѧϰAngular������', ['ͼ��']),
    new Product(3, '��������Ʒ', 3.99, 3.0, '���ǵ�������Ʒ����ѧϰAngular������', ['Ӳ���豸']),
    new Product(4, '���ĸ���Ʒ', 4.99, 5.0, '���ǵ��ĸ���Ʒ����ѧϰAngular������', ['���Ӳ�Ʒ']),
    new Product(5, '�������Ʒ', 5.99, 2.0, '���ǵ������Ʒ����ѧϰAngular������', ['���Ӳ�Ʒ', 'Ӳ���豸']),
    new Product(6, '��������Ʒ', 6.99, 4.0, '���ǵ�������Ʒ����ѧϰAngular������', ['ͼ��'])
];

const comments: Comment[] = [
    new Comment(1, 1, '2019-02-14 09:18', '����', 3, 'һ���ɡ�' ),
    new Comment(2, 1, '2019-01-14 03:28', '����', 4, '��Ʒ����Ŷ!'),
    new Comment(3, 1, '2019-02-24 05:18', '��', 2, '�ܲ��һ�ι������顣'),
    new Comment(4, 2, '2019-03-14 09:08', '��', 5, '�ǳ�ϲ���أ�����')
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
    console.log('�������Ѿ�������');
});


/*WebSocket ������---------*/

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

/* -------���±��ۣ������͸��ͻ���*/
const currentBids = new Map<number, number>();

setInterval(() =>{
    /*-----���±���---------*/
    products.forEach(p => {
        let currentBid = currentBids.get(p.id) || p.price;
        let newBid = currentBid + Number(Math.random()*5);
        currentBids.set(p.id, newBid);
    });

    /*-----���͸��ͻ���-------*/
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


